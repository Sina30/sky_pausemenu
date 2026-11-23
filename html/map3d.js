// sky_pausemenu: eigener 3D-Karten-Renderer (three.js)
// Liest window.MAP3D_DATA (map-data.js) und window.MAP_ZONES (zones.js) und baut daraus
// Gelände, Wasser, Straßen, Brücken und Gebäude. Farben (Tag/Nacht) kommen per Shader-Uniform.
import * as THREE from './three.module.min.js';

export { THREE };

// Farb-Slots im Shader
const C_LAND = 0, C_WATER = 1, C_ROOF = 2, C_WALL = 3, C_PATH = 4, C_ROAD = 5, C_HWY = 6, C_PLAZA = 7, C_DECK = 8, C_SHORE = 9;

export const PALETTES = {
    day: {
        land: [212, 217, 223], water: [52, 160, 198], roof: [168, 186, 212], wall: [132, 150, 180], path: [226, 230, 234],
        road: [247, 247, 244], hwy: [238, 230, 202], plaza: [196, 203, 212], deck: [150, 158, 172], shore: [112, 200, 218],
    },
    night: {
        land: [30, 34, 80], water: [44, 42, 120], roof: [80, 96, 162], wall: [52, 62, 124], path: [52, 56, 112],
        road: [126, 128, 178], hwy: [156, 156, 200], plaza: [40, 46, 98], deck: [70, 74, 128], shore: [92, 90, 172],
    },
};
const SLOT_ORDER = ['land', 'water', 'roof', 'wall', 'path', 'road', 'hwy', 'plaza', 'deck', 'shore'];

// Klassifizierung der Quellfarben
const SEA = 0, LAND = 1, BUILD = 2, PATH = 3, ROAD = 4, HWY = 5;
function kindOf([r, g, b]) {
    if (b > r + 6) return SEA;
    const v = (r + g + b) / 3;
    if (v <= 35) return LAND;
    if (v < 130) return BUILD;
    if (v < 131) return PATH;
    return v <= 180 ? ROAD : HWY;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// kleine Pause, damit das Laden die NUI nicht einfriert
let lastBreath = 0;
const breathe = () => {
    const now = performance.now();
    if (now - lastBreath < 12) return null;
    return new Promise((r) => setTimeout(() => { lastBreath = performance.now(); r(); }, 0));
};

// ---------------------------------------------------------------------------------------------
// Dekodieren der Binärdaten
// ---------------------------------------------------------------------------------------------
async function decode(data) {
    const meta = data.meta;
    const bin = atob(data.bin);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const dv = new DataView(u8.buffer);
    const g = meta.grid, sec = meta.sections;

    const heights = new Float32Array(g.nx * g.ny);
    for (let i = 0; i < heights.length; i++) heights[i] = dv.getInt16(sec.terrain + i * 2, true) / 10;
    const landcells = u8.subarray(sec.landcells, sec.shapes);

    let p = sec.shapes;
    const varint = () => { let v = 0, m = 1, b; do { b = u8[p++]; v += (b & 0x7f) * m; m *= 128; } while (b & 0x80); return v; };
    const zz = (v) => (v % 2 ? -(v + 1) / 2 : v / 2);
    const u16 = () => { const v = dv.getUint16(p, true); p += 2; return v / 10; };
    const ring = () => {
        const n = varint(), pts = new Float64Array(n * 2);
        let x = 0, y = 0;
        for (let j = 0; j < n; j++) { x += zz(varint()); y += zz(varint()); pts[j * 2] = g.x0 + x / 10; pts[j * 2 + 1] = g.y0 + y / 10; }
        return pts;
    };

    const kinds = meta.colours.map(kindOf);
    const shapes = new Array(meta.shapes);
    for (let i = 0; i < meta.shapes; i++) {
        const col = u8[p++], fl = u8[p++];
        let polys;
        if (fl & 4) {
            polys = [];
            for (let a = varint(); a > 0; a--) { const rs = []; for (let b = varint(); b > 0; b--) rs.push(ring()); polys.push(rs); }
        } else {
            const r = ring();
            if (fl & 1) p += (r.length / 2) * 2; // Höhen-Offsets pro Punkt (nicht benötigt)
            polys = [[r]];
        }
        const level = fl & 2 ? u16() : 0;
        const bottom = fl & 128 ? u16() : 0;
        let decks = null;
        if (fl & 16) {
            decks = [];
            for (let c = varint(); c > 0; c--) {
                for (let a = varint(); a > 0; a--) {
                    const rs = [];
                    for (let b = varint(); b > 0; b--) {
                        const pts = ring(), n = pts.length / 2, z = new Float32Array(n), seam = new Uint8Array(n);
                        for (let j = 0; j < n; j++) z[j] = u16() - 100;
                        for (let j = 0; j < n; j++) seam[j] = (u8[p + (j >> 3)] >> (j & 7)) & 1;
                        p += (n + 7) >> 3;
                        rs.push({ pts, z, seam });
                    }
                    decks.push(rs);
                }
            }
        }
        shapes[i] = {
            col, rgb: meta.colours[col], kind: kinds[col], polys, level, bottom, decks, top: 0,
            drape: !!(fl & 8), topOnly: !!(fl & 32), tiltOnly: !!(fl & 64),
        };
        if ((i & 255) === 0) await breathe();
    }
    p = sec.tops;
    for (const s of shapes) if (s.kind === BUILD) { s.top = dv.getUint16(p, true) / 10; p += 2; }
    return { meta, grid: g, heights, landcells, shapes };
}

// ---------------------------------------------------------------------------------------------
// Gelände (20-m-Raster) mit Land/Wasser-Maske (40-m-Zellen)
// ---------------------------------------------------------------------------------------------
export class Ground {
    constructor(dec) {
        const g = dec.grid;
        this.x0 = g.x0; this.y0 = g.y0; this.D = g.step; this.nx = g.nx; this.ny = g.ny; this.h = dec.heights;
        this.drape = dec.meta.drape;
        this.cnx = Math.floor((g.nx - 1) / this.drape); this.cny = Math.floor((g.ny - 1) / this.drape);
        this.mask = dec.landcells;
    }
    H(i, j) { return this.h[clamp(j, 0, this.ny - 1) * this.nx + clamp(i, 0, this.nx - 1)]; }
    cellLand(ci, cj) {
        if (ci < 0 || cj < 0 || ci >= this.cnx || cj >= this.cny) return 0;
        const k = cj * this.cnx + ci;
        return (this.mask[k >> 3] >> (k & 7)) & 1;
    }
    vertLand(i, j) {
        const d = this.drape, a = Math.floor(i / d), b = Math.floor(j / d), a2 = Math.floor((i - 1) / d), b2 = Math.floor((j - 1) / d);
        return this.cellLand(a, b) || this.cellLand(a2, b) || this.cellLand(a, b2) || this.cellLand(a2, b2);
    }
    // gleiche Dreiecksteilung wie das Gelände-Mesh (Diagonale 00-11)
    at(x, y) {
        const gx = (x - this.x0) / this.D, gy = (y - this.y0) / this.D;
        const i = clamp(Math.floor(gx), 0, this.nx - 2), j = clamp(Math.floor(gy), 0, this.ny - 2);
        const u = gx - i, v = gy - j;
        const h00 = this.H(i, j), h10 = this.H(i + 1, j), h11 = this.H(i + 1, j + 1), h01 = this.H(i, j + 1);
        return v <= u ? h00 + (h10 - h00) * u + (h11 - h10) * v : h00 + (h11 - h01) * u + (h01 - h00) * v;
    }
    slopeShade(i, j) {
        const dx = (this.H(i + 1, j) - this.H(i - 1, j)) / (2 * this.D), dy = (this.H(i, j + 1) - this.H(i, j - 1)) / (2 * this.D);
        const nz = 1 / Math.hypot(dx, dy, 1);
        return clamp(0.32 + 0.72 * (0.45 * dx - 0.45 * dy + 0.77) * nz, 0.58, 1.0);
    }
}

// ---------------------------------------------------------------------------------------------
// Geometrie-Puffer (nicht indiziert): position + aInfo(slot, shade, tone, extra)
// extra = Basis-Z bei Gebäuden, sonst Anhebe-Faktor gegen Z-Fighting
// ---------------------------------------------------------------------------------------------
class Buf {
    constructor() { this.p = new Float32Array(3 * 8192); this.a = new Float32Array(4 * 8192); this.n = 0; }
    v(x, y, z, slot, shade, tone, extra) {
        if ((this.n + 1) * 3 > this.p.length) {
            const p = new Float32Array(this.p.length * 2); p.set(this.p); this.p = p;
            const a = new Float32Array(this.a.length * 2); a.set(this.a); this.a = a;
        }
        const i = this.n++;
        this.p[i * 3] = x; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] = z;
        this.a[i * 4] = slot; this.a[i * 4 + 1] = shade; this.a[i * 4 + 2] = tone; this.a[i * 4 + 3] = extra;
    }
    geometry() {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(this.p.slice(0, this.n * 3), 3));
        g.setAttribute('aInfo', new THREE.BufferAttribute(this.a.slice(0, this.n * 4), 4));
        g.computeBoundingSphere();
        return g;
    }
}

// Polygon (Außenring + Löcher) triangulieren -> flache Liste [x,y, x,y, x,y, ...] pro Dreieck
function triangulate(rings) {
    const vecs = rings.map((r) => { const a = []; for (let i = 0; i < r.length; i += 2) a.push(new THREE.Vector2(r[i], r[i + 1])); return a; });
    if (vecs[0].length < 3) return [];
    let faces;
    try { faces = THREE.ShapeUtils.triangulateShape(vecs[0], vecs.slice(1)); } catch (e) { return []; }
    const all = [].concat(...vecs);
    const out = [];
    for (const f of faces) {
        const a = all[f[0]], b = all[f[1]], c = all[f[2]];
        if (!a || !b || !c) continue;
        out.push(a.x, a.y, b.x, b.y, c.x, c.y);
    }
    return out;
}

// Dreieck so lange teilen, bis keine Kante länger als max ist (für Gelände-Folgen)
function subdivide(ax, ay, bx, by, cx, cy, max2, emit, depth = 0) {
    const ab = (bx - ax) ** 2 + (by - ay) ** 2, bc = (cx - bx) ** 2 + (cy - by) ** 2, ca = (ax - cx) ** 2 + (ay - cy) ** 2;
    const m = Math.max(ab, bc, ca);
    if (m <= max2 || depth > 9) { emit(ax, ay, bx, by, cx, cy); return; }
    if (m === ab) { const mx = (ax + bx) / 2, my = (ay + by) / 2; subdivide(ax, ay, mx, my, cx, cy, max2, emit, depth + 1); subdivide(mx, my, bx, by, cx, cy, max2, emit, depth + 1); }
    else if (m === bc) { const mx = (bx + cx) / 2, my = (by + cy) / 2; subdivide(ax, ay, bx, by, mx, my, max2, emit, depth + 1); subdivide(ax, ay, mx, my, cx, cy, max2, emit, depth + 1); }
    else { const mx = (cx + ax) / 2, my = (cy + ay) / 2; subdivide(ax, ay, bx, by, mx, my, max2, emit, depth + 1); subdivide(mx, my, bx, by, cx, cy, max2, emit, depth + 1); }
}

const ringArea = (r) => { let a = 0; for (let i = 0, n = r.length / 2, j = n - 1; i < n; j = i++) a += r[j * 2] * r[i * 2 + 1] - r[i * 2] * r[j * 2 + 1]; return a / 2; };
const LIGHT = (() => { const l = [0.55, -0.83]; const d = Math.hypot(l[0], l[1]); return [l[0] / d, l[1] / d]; })();
// Wand-Helligkeit nach Ausrichtung zum Licht (Außennormale)
function wallShade(dx, dy, sign) {
    const len = Math.hypot(dx, dy) || 1;
    const nx = (dy / len) * sign, ny = (-dx / len) * sign;
    return 0.6 + 0.32 * (0.5 + 0.5 * (nx * LIGHT[0] + ny * LIGHT[1]));
}

// ---------------------------------------------------------------------------------------------
// Welt
// ---------------------------------------------------------------------------------------------
const CHUNK = 1200;

const VERT = `
#include <common>
#include <logdepthbuf_pars_vertex>
attribute vec4 aInfo;
uniform float uRise;
uniform float uLift;
varying vec4 vInfo;
varying float vDist;
void main() {
    vec3 p = position;
    float k = aInfo.x;
    if (k > 1.5 && k < 3.5) { p.z = mix(aInfo.w, p.z, uRise); }
    else { p.z += aInfo.w * uLift; }
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vInfo = aInfo;
    vDist = -mv.z;
    #include <logdepthbuf_vertex>
}`;
const FRAG = `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColD[10];
uniform vec3 uColN[10];
uniform float uDay;
uniform float uFogNear;
uniform float uFogFar;
varying vec4 vInfo;
varying float vDist;
void main() {
    #include <logdepthbuf_fragment>
    int k = int(vInfo.x + 0.5);
    vec3 c = mix(uColN[k], uColD[k], uDay);
    if (k == 1) c = mix(c, mix(uColN[9], uColD[9], uDay), clamp(vInfo.z, 0.0, 1.0));
    c *= vInfo.y;
    vec3 fog = mix(uColN[0], uColD[0], uDay);
    c = mix(c, fog, smoothstep(uFogNear, uFogFar, vDist) * 0.9);
    gl_FragColor = vec4(c, 1.0);
}`;

export class MapWorld {
    constructor() {
        this.scene = new THREE.Scene();
        this.groups = { common: new THREE.Group(), tilt: new THREE.Group(), top: new THREE.Group() };
        Object.values(this.groups).forEach((g) => this.scene.add(g));
        this.groups.top.visible = false;
        this.material = new THREE.ShaderMaterial({
            vertexShader: VERT,
            fragmentShader: FRAG,
            side: THREE.DoubleSide,
            uniforms: {
                uRise: { value: 1 }, uLift: { value: 0.3 }, uDay: { value: 1 },
                uFogNear: { value: 20000 }, uFogFar: { value: 40000 },
                uColD: { value: SLOT_ORDER.map(() => new THREE.Vector3()) },
                uColN: { value: SLOT_ORDER.map(() => new THREE.Vector3()) },
            },
        });
        this.setPalettes(PALETTES.day, PALETTES.night);
        this.zones = [];
        this.counties = [];
        this.ready = false;
    }

    setPalettes(day, night) {
        SLOT_ORDER.forEach((k, i) => {
            const d = day[k] || PALETTES.day[k], n = night[k] || PALETTES.night[k];
            this.material.uniforms.uColD.value[i].set(d[0] / 255, d[1] / 255, d[2] / 255);
            this.material.uniforms.uColN.value[i].set(n[0] / 255, n[1] / 255, n[2] / 255);
        });
        const l = day.water || PALETTES.day.water, ln = night.water || PALETTES.night.water;
        this.bgDay = new THREE.Color(l[0] / 255, l[1] / 255, l[2] / 255);
        this.bgNight = new THREE.Color(ln[0] / 255, ln[1] / 255, ln[2] / 255);
    }
    background(day) { return this.bgNight.clone().lerp(this.bgDay, day); }
    set day(v) { this.material.uniforms.uDay.value = v; }
    set rise(v) { this.material.uniforms.uRise.value = v; }
    set lift(v) { this.material.uniforms.uLift.value = v; }
    fog(near, far) { this.material.uniforms.uFogNear.value = near; this.material.uniforms.uFogFar.value = far; }
    setFlat(flat) { this.groups.tilt.visible = !flat; this.groups.top.visible = flat; }

    async load(onProgress = () => {}) {
        onProgress('Kartendaten werden gelesen …');
        const dec = await decode(window.MAP3D_DATA);
        window.MAP3D_DATA = null; // Speicher freigeben
        const ground = this.ground = new Ground(dec);
        const buckets = new Map();
        const bucket = (route, x, y) => {
            const k = `${route}:${Math.floor(x / CHUNK)}:${Math.floor(y / CHUNK)}`;
            let b = buckets.get(k);
            if (!b) { b = { route, buf: new Buf() }; buckets.set(k, b); }
            return b.buf;
        };

        // ---- Gelände ----
        onProgress('Gelände wird gebaut …');
        const CH = 60; // Rasterzellen pro Gelände-Stück
        for (let cj = 0; cj < ground.ny - 1; cj += CH) {
            for (let ci = 0; ci < ground.nx - 1; ci += CH) {
                const buf = new Buf();
                const vz = (i, j) => (ground.vertLand(i, j) ? ground.H(i, j) : Math.min(ground.H(i, j), -0.4));
                const vx = (i) => ground.x0 + i * ground.D, vy = (j) => ground.y0 + j * ground.D;
                const put = (i, j) => {
                    const land = ground.vertLand(i, j);
                    if (land) buf.v(vx(i), vy(j), vz(i, j), C_LAND, ground.slopeShade(i, j), 0, 0);
                    else buf.v(vx(i), vy(j), vz(i, j), C_WATER, 1, clamp(1 + ground.H(i, j) / 30, 0, 1) * 0.35, 0);
                };
                for (let j = cj; j < Math.min(cj + CH, ground.ny - 1); j++) {
                    for (let i = ci; i < Math.min(ci + CH, ground.nx - 1); i++) {
                        put(i, j); put(i + 1, j); put(i + 1, j + 1);
                        put(i, j); put(i + 1, j + 1); put(i, j + 1);
                    }
                }
                this.addMesh('common', buf, -2);
                const w = breathe(); if (w) await w;
            }
        }

        // ---- Formen ----
        onProgress('Straßen und Gebäude werden gebaut …');
        const MAX2 = 22 * 22;
        const drape = (buf, rings, zfn, slot, shade, toneOf, lift) => {
            const tris = triangulate(rings);
            for (let t = 0; t < tris.length; t += 6) {
                subdivide(tris[t], tris[t + 1], tris[t + 2], tris[t + 3], tris[t + 4], tris[t + 5], MAX2, (ax, ay, bx, by, cx, cy) => {
                    buf.v(ax, ay, zfn(ax, ay), slot, shade, toneOf, lift);
                    buf.v(bx, by, zfn(bx, by), slot, shade, toneOf, lift);
                    buf.v(cx, cy, zfn(cx, cy), slot, shade, toneOf, lift);
                });
            }
        };
        const flat = (buf, rings, z, slot, shade, tone, lift) => {
            const tris = triangulate(rings);
            for (let t = 0; t < tris.length; t += 2) buf.v(tris[t], tris[t + 1], z, slot, shade, tone, lift);
        };
        const waterTone = (rgb) => clamp(((rgb[0] + rgb[1] + rgb[2]) / 765 - 0.25) / 0.62, 0, 1);
        const roadSlot = (k) => (k === HWY ? C_HWY : k === PATH ? C_PATH : C_ROAD);

        for (let s = 0; s < dec.shapes.length; s++) {
            const sh = dec.shapes[s];
            const route = sh.topOnly ? 'top' : sh.tiltOnly ? 'tilt' : 'common';
            for (const rings of sh.polys) {
                if (!rings.length || rings[0].length < 6) continue;
                const fx = rings[0][0], fy = rings[0][1];
                const buf = bucket(route, fx, fy);

                if (sh.kind === BUILD && !sh.drape) {
                    this.building(buf, rings, sh);
                } else if (sh.kind === BUILD) {
                    drape(buf, rings, (x, y) => ground.at(x, y) + 0.25, C_PLAZA, 1, 0, 1);
                } else if (sh.kind === SEA && sh.level > 0 && !sh.drape) {
                    const z = sh.level;
                    drape(buf, rings, (x, y) => Math.max(z, ground.at(x, y) + 0.05) + 0.05, C_WATER, 1, waterTone(sh.rgb), 0.5);
                } else if (sh.kind === SEA && !sh.drape) {
                    flat(buf, rings, 0.05, C_WATER, 1, waterTone(sh.rgb), 0.3);
                } else if (sh.kind === SEA) {
                    drape(buf, rings, (x, y) => Math.max(0, ground.at(x, y)) + 0.15, C_WATER, 1, waterTone(sh.rgb), 0.6);
                } else if (sh.kind === ROAD || sh.kind === HWY || sh.kind === PATH) {
                    const lift = sh.kind === HWY ? 1.2 : sh.kind === ROAD ? 1.0 : 0.8;
                    drape(buf, rings, (x, y) => ground.at(x, y) + 0.35, roadSlot(sh.kind), 1, 0, lift);
                } else {
                    drape(buf, rings, (x, y) => ground.at(x, y) + 0.1, C_LAND, 1, 0, 0.3);
                }
            }

            // Brücken / Hochstraßen: echte Höhe pro Punkt + Seitenwände
            if (sh.decks) {
                for (const rs of sh.decks) {
                    if (!rs.length || rs[0].pts.length < 6) continue;
                    const buf = bucket('tilt', rs[0].pts[0], rs[0].pts[1]);
                    this.deck(buf, rs, roadSlot(sh.kind));
                }
            }
            if ((s & 63) === 0) { const w = breathe(); if (w) await w; }
        }

        for (const { route, buf } of buckets.values()) {
            if (buf.n) this.addMesh(route, buf, 0);
        }

        // ---- Gebiete ----
        const Z = window.MAP_ZONES || { counties: [], districts: [] };
        const prep = (z) => {
            let best = null, bestA = 0;
            for (const r of z.rings) { const flatR = r.flat(); const a = Math.abs(ringArea(flatR)); if (a > bestA) { bestA = a; best = r; } }
            let cx = 0, cy = 0;
            if (best) { for (const q of best) { cx += q[0]; cy += q[1]; } cx /= best.length; cy /= best.length; }
            return { name: z.name, county: z.county, rings: z.rings, cx, cy, area: bestA };
        };
        this.zones = (Z.districts || []).map(prep);
        this.counties = (Z.counties || []).map(prep);
        this.ready = true;
        onProgress('');
    }

    addMesh(route, buf, order) {
        const mesh = new THREE.Mesh(buf.geometry(), this.material);
        mesh.renderOrder = order;
        mesh.matrixAutoUpdate = false;
        this.groups[route].add(mesh);
    }

    building(buf, rings, sh) {
        const g = this.ground;
        const gs = [];
        for (const r of rings) for (let i = 0; i < r.length; i += 2) gs.push(g.at(r[i], r[i + 1]));
        let gmin = Infinity, gmax = -Infinity;
        for (const v of gs) { if (v < gmin) gmin = v; if (v > gmax) gmax = v; }
        const gmed = gs.slice().sort((a, b) => a - b)[gs.length >> 1];
        const tris = triangulate(rings);
        if (!tris.length) return;

        // schwebende Teile (z. B. Überbauten) mit eigener Unterkante
        if (sh.bottom > 0) {
            const top = Math.max(sh.top, sh.bottom + 1), bot = sh.bottom;
            for (let t = 0; t < tris.length; t += 2) buf.v(tris[t], tris[t + 1], top, C_ROOF, 1, 0, bot);
            for (let t = 0; t < tris.length; t += 2) buf.v(tris[t], tris[t + 1], bot, C_WALL, 0.5, 0, bot);
            this.walls(buf, rings, () => top, () => bot, bot);
            return;
        }
        const follow = gmax - gmin > 6 || !(sh.top > 0);
        const hgt = sh.top > 0 ? Math.max(1.5, sh.top - (follow ? gmed : gmin)) : 2.5;
        const roofAt = (x, y) => (follow ? g.at(x, y) + hgt : Math.max(sh.top, gmax + 1));
        const base = gmin - 1;
        for (let t = 0; t < tris.length; t += 2) {
            const x = tris[t], y = tris[t + 1];
            buf.v(x, y, roofAt(x, y), C_ROOF, 1, 0, base);
        }
        this.walls(buf, rings, roofAt, (x, y) => g.at(x, y) - 1, base);
    }

    walls(buf, rings, topAt, botAt, base) {
        rings.forEach((r, ri) => {
            const n = r.length / 2;
            const sign = (ringArea(r) >= 0 ? 1 : -1) * (ri === 0 ? 1 : -1);
            for (let k = 0; k < n; k++) {
                const k2 = (k + 1) % n;
                const ax = r[k * 2], ay = r[k * 2 + 1], bx = r[k2 * 2], by = r[k2 * 2 + 1];
                if (Math.hypot(bx - ax, by - ay) < 0.05) continue;
                const s = wallShade(bx - ax, by - ay, sign);
                const at = topAt(ax, ay), bt = topAt(bx, by), ab = botAt(ax, ay), bb = botAt(bx, by);
                buf.v(ax, ay, at, C_WALL, s, 0, base); buf.v(ax, ay, ab, C_WALL, s, 0, base); buf.v(bx, by, bb, C_WALL, s, 0, base);
                buf.v(ax, ay, at, C_WALL, s, 0, base); buf.v(bx, by, bb, C_WALL, s, 0, base); buf.v(bx, by, bt, C_WALL, s, 0, base);
            }
        });
    }

    deck(buf, rs, slot) {
        const g = this.ground;
        // Oberseite: Höhe pro Punkt, im Dreieck aus den Ecken interpoliert
        const vecs = rs.map((r) => {
            const a = [];
            for (let i = 0; i < r.pts.length / 2; i++) { const v = new THREE.Vector2(r.pts[i * 2], r.pts[i * 2 + 1]); v.z = r.z[i]; a.push(v); }
            return a;
        });
        let faces;
        try { faces = THREE.ShapeUtils.triangulateShape(vecs[0], vecs.slice(1)); } catch (e) { faces = []; }
        const all = [].concat(...vecs);
        for (const f of faces) {
            const q = f.map((i) => all[i]);
            if (q.some((v) => !v)) continue;
            for (const v of q) buf.v(v.x, v.y, v.z + 0.35, slot, 0.97, 0, 1.0);
        }
        // Seitenwände, wo die Fahrbahn über dem Boden liegt
        for (const r of rs) {
            const n = r.pts.length / 2;
            for (let k = 0; k < n; k++) {
                if (r.seam[k]) continue;
                const k2 = (k + 1) % n;
                const ax = r.pts[k * 2], ay = r.pts[k * 2 + 1], bx = r.pts[k2 * 2], by = r.pts[k2 * 2 + 1];
                const az = r.z[k], bz = r.z[k2];
                const ga = g.at(ax, ay), gb = g.at(bx, by);
                if (az - ga < 1 && bz - gb < 1) continue;
                const s = wallShade(bx - ax, by - ay, 1) * 0.9;
                const ab = Math.max(ga - 0.5, az - 1.6), bb = Math.max(gb - 0.5, bz - 1.6);
                buf.v(ax, ay, az + 0.3, C_DECK, s, 0, 0); buf.v(ax, ay, ab, C_DECK, s, 0, 0); buf.v(bx, by, bb, C_DECK, s, 0, 0);
                buf.v(ax, ay, az + 0.3, C_DECK, s, 0, 0); buf.v(bx, by, bb, C_DECK, s, 0, 0); buf.v(bx, by, bz + 0.3, C_DECK, s, 0, 0);
            }
        }
    }

    // Gebiet (Stadtteil + County) an einer Position
    areaAt(x, y) {
        const inside = (rings) => {
            let c = false;
            for (const r of rings) {
                for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
                    const xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1];
                    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
                }
            }
            return c;
        };
        const d = this.zones.find((z) => inside(z.rings));
        const c = d ? { name: d.county } : this.counties.find((z) => inside(z.rings));
        return { district: d ? d.name : '', county: c ? c.name : '' };
    }
}
