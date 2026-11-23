// sky_pausemenu NUI: Pausenmenü, 3D-Karten-Overlay, freie Kamera
'use strict';
import { MapWorld, THREE } from './map3d.js';

const RES = typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'sky_pausemenu';
const post = (name, data) => fetch(`https://${RES}/${name}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json; charset=UTF-8' }, body: JSON.stringify(data || {}),
}).then((r) => r.json()).catch(() => null);
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- eigene Icons (SVG-Pfade, Stroke-Stil) ----------
const ICONS = {
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    game: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M10 3v4M14 3v4M9 12h6"/>',
    store: '<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    settings: '<path d="M6 4v6M6 14v6M12 4v2M12 10v10M18 4v10M18 18v2"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="8" r="2"/><circle cx="18" cy="16" r="2"/>',
    nav: '<path d="M12 3 5 20l7-4 7 4z" fill="currentColor"/>',
    money: '<path d="M9 4h6l-2 3h-2z"/><path d="M11 7C6 9 4 14 5 18c.5 2 2 3 4 3h6c2 0 3.5-1 4-3 1-4-1-9-6-11z"/><path d="M14 11.5c-.5-.7-1.3-1-2-1-1.2 0-2 .6-2 1.5 0 2 4 1 4 3 0 .9-.9 1.5-2 1.5-.8 0-1.6-.3-2-1M12 9.5v1M12 16.5v1"/>',
    cart: '<path d="M3 4h2l2.5 11h10L20 7H6.5"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
    car: '<path d="M5 16v3M19 16v3M3 16V12l2-5h14l2 5v4z"/><path d="M3 12h18"/><circle cx="7" cy="14" r=".8"/><circle cx="17" cy="14" r=".8"/>',
    wrench: '<path d="M14.5 6.5a4 4 0 0 0 5 5L13 18a2.1 2.1 0 0 1-3-3l6.5-6.5a4 4 0 0 0-2-2z"/><path d="M5 19l4-4"/>',
    gun: '<path d="M3 8h17v4h-8l-1 2H8l-1 5H4l1-6-2-1z"/><path d="M17 8V6"/>',
    shirt: '<path d="M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3z"/>',
    food: '<path d="M6 3v7a2 2 0 0 0 2 2v9M10 3v7a2 2 0 0 1-2 2M8 3v5M17 21V3c-2 1-3 4-3 7h3"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    pin: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    chevL: '<path d="m15 6-6 6 6 6"/>',
    arrow: '<path d="M12 3 5 20l7-4 7 4z"/>',
    plug: '<path d="M9 7V3M15 7V3M6 7h12v4a6 6 0 0 1-12 0zM12 17v4"/>',
    power: '<path d="M12 3v8M6.3 6.3a8 8 0 1 0 11.4 0"/>',
    pause: '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>',
    keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
    ruler: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
};
const icon = (name, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24">${ICONS[name] || ICONS.pin}</svg>`;

// ---------- Zustand ----------
const S = {
    cfg: null,
    open: false,
    page: 'home',          // home | Menüpunkt-ID
    focus: 'items',        // items | content
    itemSel: 0,
    rowSel: 0,
    rows: [],              // aktive Zeilen im Inhalt (Objekte mit act/left/right)
    cam: { speed: 100, fov: 50, roll: 0, grid: false },
    local: Object.assign({ units: null, sounds: true }, JSON.parse(localStorage.getItem('sky_pm') || '{}')),
    ask: null,
};
const saveLocal = () => localStorage.setItem('sky_pm', JSON.stringify(S.local));
const sound = (name) => { if (S.local.sounds !== false) post('sound', { name }); };
const units = () => S.local.units || (S.cfg && S.cfg.units) || 'km';

function fmtDist(m) {
    if (m == null || isNaN(m)) return '';
    if (units() === 'mi') return `${(m / 1609.34).toFixed(2)} mi`;
    return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

// =====================================================================
// PAUSENMENÜ
// =====================================================================
function renderItems() {
    const ul = $('items');
    ul.innerHTML = S.cfg.items.map((it, i) =>
        `<li data-i="${i}" class="${i === S.itemSel ? 'sel' : ''}">${icon(it.id)}<span>${esc(it.label)}</span></li>`).join('');
    ul.querySelectorAll('li').forEach((li) => {
        li.onmouseenter = () => { if (S.focus === 'items' && +li.dataset.i !== S.itemSel) { S.itemSel = +li.dataset.i; sound('nav'); renderItems(); } };
        li.onclick = () => { S.itemSel = +li.dataset.i; activateItem(); };
    });
}

function renderTop(info) {
    if (!info) return;
    const hh = String(info.hour).padStart(2, '0');
    const mm = String(info.minute).padStart(2, '0');
    $('topinfo').innerHTML = `<div class="t">${esc(info.name)}</div><div class="s">ID ${esc(info.id)} · ${hh}:${mm} · ${esc(info.zone)}</div>`;
    $('playerLine').textContent = `${info.name} · ID ${info.id}`;
}

function setHints(el, list) {
    el.innerHTML = list.map(([label, key, act]) => `<div data-act="${act || ''}">${esc(label)} <span class="key">${esc(key)}</span></div>`).join('');
    el.querySelectorAll('div').forEach((d) => {
        if (d.dataset.act) d.onclick = () => handleKey({ key: d.dataset.act, preventDefault() {} });
    });
}
function menuHints() {
    const l = S.focus === 'content'
        ? [['AUSWÄHLEN', 'ENTER', 'Enter'], ['ÄNDERN', '◀ ▶'], ['ZURÜCK', 'ESC', 'Escape']]
        : [['AUSWÄHLEN', 'ENTER', 'Enter'], ['SCHLIESSEN', 'ESC', 'Escape']];
    setHints($('menuHints'), l);
}

function openMenu(page, info) {
    S.open = true;
    $('menu').classList.remove('hidden');
    $('map').classList.add('hidden');
    $('freecam').classList.add('hidden');
    renderTop(info);
    if (page && page !== 'home') {
        const i = S.cfg.items.findIndex((x) => x.id === page);
        if (i >= 0) S.itemSel = i;
        renderItems();
        showContent(page, true);
    } else {
        S.focus = 'items';
        renderItems();
        $('content').classList.add('hidden');
        S.page = 'home';
    }
    menuHints();
}

function closeMenuUI() {
    S.open = false;
    $('menu').classList.add('hidden');
    $('ask').classList.add('hidden');
    S.ask = null;
}

function activateItem() {
    const it = S.cfg.items[S.itemSel];
    if (!it) return;
    if (it.id === 'map') { sound('select'); post('openMap'); return; }
    sound('select');
    showContent(it.id, true);
}

function showContent(id, focus) {
    S.page = id;
    S.rowSel = 0;
    const c = $('content');
    c.classList.remove('hidden');
    S.rows = [];
    let html = '';

    if (id === 'game') {
        html = `<h2>SPIEL</h2><p class="lead">Verbindung trennen oder das Spiel beenden.</p><ul class="rows" id="rows"></ul><div class="desc" id="desc"></div>`;
        S.rows = [
            { label: 'Verbindung trennen', icon: 'plug', desc: 'Du verlässt den Server und kehrst zum FiveM-Hauptmenü zurück.', act: () => askFor('VERBINDUNG TRENNEN', 'Möchtest du den Server wirklich verlassen?', () => post('game', { action: 'disconnect' })) },
            { label: 'Spiel beenden', icon: 'power', desc: 'Schließt GTA V komplett.', act: () => askFor('SPIEL BEENDEN', 'Möchtest du das Spiel wirklich beenden?', () => post('game', { action: 'quit' })) },
            { label: 'GTA-Pausenmenü', icon: 'pause', desc: 'Öffnet das originale GTA-Pausenmenü (Karte, Statistiken, Galerie, Rockstar Editor).', act: () => post('game', { action: 'gtapause' }) },
        ];
    } else if (id === 'store') {
        const st = S.cfg.store || {};
        html = `<h2>${esc(st.title || 'SHOP')}</h2><p class="lead">${esc(st.text)}</p>
            <div class="pkgs">${(st.packages || []).map((p) => `<div class="pkg"><b>${esc(p.name)}</b><div class="price">${esc(p.price)}</div><span>${esc(p.text)}</span></div>`).join('')}</div>
            ${st.link ? `<div class="link">${esc(st.link)}</div>` : ''}`;
    } else if (id === 'help') {
        html = `<h2>HILFE</h2><ul class="faq" id="faq">${(S.cfg.help || []).map((h, i) =>
            `<li data-i="${i}"><b>${esc(h.q)} ${icon('chev')}</b><p>${esc(h.a)}</p></li>`).join('')}</ul>`;
        S.rows = (S.cfg.help || []).map((h, i) => ({ faq: i, act: () => toggleFaq(i) }));
    } else if (id === 'camera') {
        const fc = S.cfg.freecam;
        html = `<h2>FREIE KAMERA</h2><p class="lead">Für Screenshots. WASD bewegen, Shift/Strg hoch/runter, Maus umsehen, Mausrad Sichtfeld, Q/E Rollen, G Raster, H Hinweise, ESC zurück.</p><ul class="rows" id="rows"></ul><div class="desc" id="desc"></div>`;
        S.rows = [
            { label: 'Geschwindigkeit', key: 'speed', min: 10, max: 300, step: 10, unit: '%', desc: 'Wie schnell sich die Kamera bewegt.' },
            { label: 'Sichtfeld', key: 'fov', min: fc.minFov, max: fc.maxFov, step: 1, unit: '°', desc: 'Wie weit die Kamera sieht. Das Mausrad zoomt auch.' },
            { label: 'Rollwinkel', key: 'roll', min: -45, max: 45, step: 1, unit: '°', desc: 'Kippt die Kamera zur Seite.' },
            { label: 'Raster', key: 'grid', toggle: true, desc: 'Drittel-Raster zum Ausrichten des Bildes.' },
            { label: 'KAMERA STARTEN', icon: 'camera', desc: 'Startet die freie Kamera an deiner aktuellen Position.', act: () => post('freecam', S.cam) },
        ];
        S.rows.forEach((r) => {
            if (r.key && !r.toggle) {
                r.left = () => { S.cam[r.key] = Math.max(r.min, S.cam[r.key] - r.step); };
                r.right = () => { S.cam[r.key] = Math.min(r.max, S.cam[r.key] + r.step); };
            } else if (r.toggle) {
                r.left = r.right = r.act = () => { S.cam[r.key] = !S.cam[r.key]; };
            }
        });
    } else if (id === 'settings') {
        openSettings();
        return;
    } else if (id === '__oldsettings') {
        html = `<h2>EINSTELLUNGEN</h2><p class="lead">Grafik, Anzeige, Audio, Sprachchat, Steuerung und Kamera öffnen GTAs eigenes Einstellungsmenü. Jede Änderung dort ist echt und wird von GTA gespeichert.</p><ul class="rows" id="rows"></ul><div class="desc" id="desc"></div>`;
        S.rows = [
            { label: 'GTA-Einstellungen', icon: 'settings', desc: 'Anzeige, Grafik, Erweiterte Grafik, Audio, Sprachchat, Steuerung, Kamera, Rockstar Editor.', act: () => post('settings', { which: 'gta' }) },
            { label: 'Tastenbelegung', icon: 'keyboard', desc: 'FiveM-Tastenbelegungen aller Scripts auf dem Server ändern.', act: () => post('settings', { which: 'keys' }) },
            { label: 'Einheiten', icon: 'ruler', opts: ['km', 'mi'], get: () => units(), set: (v) => { S.local.units = v; saveLocal(); }, desc: 'Entfernungen auf der Karte in Kilometern oder Meilen.' },
            { label: 'Menü-Sounds', icon: 'sound', opts: [true, false], names: ['AN', 'AUS'], get: () => S.local.sounds !== false, set: (v) => { S.local.sounds = v; saveLocal(); }, desc: 'GTA-eigene Sounds beim Navigieren im Menü.' },
        ];
        S.rows.forEach((r) => {
            if (!r.opts) return;
            const step = (d) => { const i = r.opts.indexOf(r.get()); r.set(r.opts[(i + d + r.opts.length) % r.opts.length]); };
            r.left = () => step(-1); r.right = () => step(1); r.act = () => step(1);
        });
    }

    c.innerHTML = html;
    if (focus && S.rows.length) S.focus = 'content';
    else S.focus = 'items';
    c.classList.toggle('focus', S.focus === 'content');
    renderRows();
    menuHints();
}

function rowValue(r) {
    if (r.key && r.toggle) return S.cam[r.key] ? 'AN' : 'AUS';
    if (r.key) return `${S.cam[r.key]}${r.unit}`;
    if (r.opts) { const v = r.get(); const i = r.opts.indexOf(v); return r.names ? r.names[i] : String(v).toUpperCase(); }
    return null;
}

function renderRows() {
    const faq = $('faq');
    if (faq) {
        faq.querySelectorAll('li').forEach((li, i) => {
            li.classList.toggle('sel', S.focus === 'content' && i === S.rowSel);
            li.onclick = () => { S.rowSel = i; S.focus = 'content'; toggleFaq(i); };
        });
        return;
    }
    const ul = $('rows');
    if (!ul) return;
    ul.innerHTML = S.rows.map((r, i) => {
        const v = rowValue(r);
        let val = '';
        if (r.key && !r.toggle) {
            const pct = ((S.cam[r.key] - r.min) / (r.max - r.min)) * 100;
            val = `<span class="val"><span class="arr" data-d="-1">${icon('chevL')}</span><span class="bar"><i style="width:${pct}%"></i></span><span>${esc(v)}</span><span class="arr" data-d="1">${icon('chev')}</span></span>`;
        } else if (v != null) {
            val = `<span class="val"><span class="arr" data-d="-1">${icon('chevL')}</span><span>${esc(v)}</span><span class="arr" data-d="1">${icon('chev')}</span></span>`;
        } else {
            val = `<span class="val">${icon('chev')}</span>`;
        }
        return `<li data-i="${i}" class="${S.focus === 'content' && i === S.rowSel ? 'sel' : ''}"><span class="lbl">${r.icon ? icon(r.icon) : ''}${esc(r.label)}</span>${val}</li>`;
    }).join('');
    ul.querySelectorAll('li').forEach((li) => {
        const i = +li.dataset.i;
        li.onmouseenter = () => { if (S.rowSel !== i || S.focus !== 'content') { S.focus = 'content'; S.rowSel = i; sound('nav'); renderRows(); menuHints(); } };
        li.onclick = (e) => {
            const r = S.rows[i];
            const arr = e.target.closest('.arr');
            if (arr) { (+arr.dataset.d < 0 ? r.left : r.right)?.(); sound('side'); renderRows(); return; }
            if (r.act) { sound('select'); r.act(); renderRows(); }
        };
    });
    const d = $('desc');
    if (d) d.textContent = S.focus === 'content' ? (S.rows[S.rowSel]?.desc || '') : '';
}

function toggleFaq(i) {
    const li = $('faq')?.querySelector(`li[data-i="${i}"]`);
    if (li) { li.classList.toggle('open'); sound('select'); }
    renderRows();
}

function askFor(title, text, yes) {
    S.ask = { yes, sel: 1 };
    $('askTitle').textContent = title;
    $('askText').textContent = text;
    $('ask').classList.remove('hidden');
    renderAsk();
}
function renderAsk() {
    $('askYes').classList.toggle('sel', S.ask && S.ask.sel === 0);
    $('askNo').classList.toggle('sel', S.ask && S.ask.sel === 1);
}
function closeAsk() { S.ask = null; $('ask').classList.add('hidden'); }
$('askYes').onclick = () => { const a = S.ask; closeAsk(); sound('select'); a?.yes(); };
$('askNo').onclick = () => { closeAsk(); sound('back'); };

function menuKey(e) {
    const k = e.key;
    if (S.ask) {
        if (k === 'ArrowLeft' || k === 'ArrowRight') { S.ask.sel = 1 - S.ask.sel; sound('side'); renderAsk(); }
        else if (k === 'Enter') (S.ask.sel === 0 ? $('askYes') : $('askNo')).click();
        else if (k === 'Escape' || k === 'Backspace') $('askNo').click();
        return;
    }
    if (S.focus === 'items') {
        const n = S.cfg.items.length;
        if (k === 'ArrowDown' || k === 'ArrowUp') {
            S.itemSel = (S.itemSel + (k === 'ArrowDown' ? 1 : -1) + n) % n;
            sound('nav'); renderItems();
            $('content').classList.add('hidden'); S.page = 'home';
        } else if (k === 'Enter' || k === 'ArrowRight') activateItem();
        else if (k === 'Escape' || k === 'Backspace') post('close');
        return;
    }
    // Inhalt
    const n = S.rows.length;
    if ((k === 'ArrowDown' || k === 'ArrowUp') && n) {
        S.rowSel = (S.rowSel + (k === 'ArrowDown' ? 1 : -1) + n) % n; sound('nav'); renderRows();
    } else if (k === 'ArrowLeft' || k === 'ArrowRight') {
        const r = S.rows[S.rowSel];
        const fn = r && (k === 'ArrowLeft' ? r.left : r.right);
        if (fn) { fn(); sound('side'); renderRows(); }
        else if (k === 'ArrowLeft') backToItems();
    } else if (k === 'Enter') {
        const r = S.rows[S.rowSel];
        if (r?.act) { if (!$('faq')) sound('select'); r.act(); renderRows(); }
    } else if (k === 'Escape' || k === 'Backspace') backToItems();
}
function backToItems() {
    sound('back');
    S.focus = 'items';
    $('content').classList.remove('focus');
    renderRows(); menuHints();
}

// =====================================================================
// EINSTELLUNGEN (Vollbild wie GTA: Tabs, Zeilen, Beschreibung)
// =====================================================================
const ST = { open: false, tabs: [], tab: 0, sel: 0, timers: {} };

// eigene Palmen-Silhouette (SVG)
const PALM = `<svg viewBox="0 0 300 420" class="palm"><path d="M150 410 C148 330 140 250 152 170 L160 170 C150 250 158 330 162 410 Z"/>
<g transform="translate(156 168)">
<path d="M0 0 C-40 -30 -95 -28 -140 6 C-95 -10 -50 -6 0 6 Z"/><path d="M0 0 C40 -32 98 -30 142 4 C96 -12 52 -8 0 6 Z"/>
<path d="M0 -2 C-20 -55 -70 -85 -120 -80 C-70 -66 -32 -40 -2 6 Z"/><path d="M0 -2 C22 -55 72 -86 122 -78 C72 -64 34 -40 2 6 Z"/>
<path d="M0 0 C-8 -60 -30 -105 -60 -125 C-38 -95 -20 -55 -4 4 Z"/><path d="M0 0 C10 -62 34 -104 66 -122 C42 -94 22 -54 4 4 Z"/>
<path d="M0 2 C-30 10 -80 40 -110 90 C-72 52 -36 30 0 12 Z"/><path d="M0 2 C32 10 82 42 108 92 C72 54 36 30 0 12 Z"/>
</g></svg>`;

function localTab() {
    return {
        id: 'menu', label: 'PAUSENMENÜ', local: true, rows: [
            { type: 'list', label: 'Einheiten auf der Karte', opts: ['Kilometer', 'Meilen'], value: units() === 'mi' ? 1 : 0, desc: 'Entfernungen auf der Karte und in der Liste.', set: (v) => { S.local.units = v ? 'mi' : 'km'; saveLocal(); } },
            { type: 'toggle', label: 'Menü-Sounds', value: S.local.sounds !== false ? 1 : 0, desc: 'GTA-eigene Sounds beim Navigieren.', set: (v) => { S.local.sounds = !!v; saveLocal(); } },
        ],
    };
}

function openSettings() {
    ST.open = true; ST.sel = 0;
    if (!$('stPalms').innerHTML) $('stPalms').innerHTML = PALM + PALM + PALM;
    $('settings').classList.remove('hidden');
    $('menu').classList.add('hidden');
    $('stRows').innerHTML = '<li class="st-wait">Einstellungen werden aus GTA gelesen …</li>';
    post('settingsOpen').then((d) => {
        if (!d || !d.tabs) return;
        ST.tabs = d.tabs.concat([localTab()]).map(prepTab);
        ST.tab = Math.min(ST.tab, ST.tabs.length - 1);
        if (d.background) {
            const im = new Image();
            im.onload = () => { $('settings').style.backgroundImage = `url(${d.background})`; $('settings').classList.add('has-img'); };
            im.src = d.background;
        }
        renderSettings();
    });
    setHints($('stHints'), [['ALLE ZURÜCKSETZEN', 'R', 'r'], ['ZURÜCK', 'ESC', 'Escape']]);
}
function closeSettings() {
    ST.open = false;
    $('settings').classList.add('hidden');
    $('menu').classList.remove('hidden');
    sound('back');
    S.focus = 'items';
    $('content').classList.add('hidden');
    renderItems(); menuHints();
}

// Zusatzzeilen: "Standardwerte wiederherstellen" bzw. Tastenbelegung wie GTA
function prepTab(t) {
    if (t.keys) { t.cat = t.cat || 0; buildKeyRows(t); return t; }
    if (!t.local && t.rows.some((r) => r.def != null)) {
        t.rows.push({ type: 'restore', label: 'Standardwerte wiederherstellen', desc: 'Setzt alle Einstellungen auf dieser Seite auf die GTA-Standardwerte zurück.' });
    }
    return t;
}
function buildKeyRows(t) {
    const cat = t.categories[t.cat] || { label: '', rows: [] };
    t.rows = [
        { type: 'kcat', label: 'Kategorie', opts: t.categories.map((c) => c.label), value: t.cat, desc: 'Wähle die Kategorie der Tastenbelegung.' },
        { type: 'native', label: 'Alle Standardwerte wiederherstellen', desc: 'Öffnet GTAs Tastenbelegung, dort werden alle Tasten auf Standard gesetzt.' },
        { type: 'head', label: cat.label.toUpperCase() },
        ...cat.rows.map((r) => ({ type: 'keys', label: r.label, k1: r.k1, k2: r.k2, desc: 'Primäre und sekundäre Taste, direkt aus GTA gelesen. ENTER oder Klick öffnet GTAs Tastenbelegung zum Ändern.' })),
        { type: 'native', fivem: true, label: 'FiveM-Tastenbelegung (Scripts)', desc: 'Tasten der Server-Scripts (z. B. Inventar, Handy) in der FiveM-Tastenbelegung ändern.' },
    ];
}
const selectable = (r) => r && r.type !== 'head';
const curTab = () => ST.tabs[ST.tab];
function rowCount(r) {
    if (r.type === 'list') return r.opts ? r.opts.length : 1;
    if (r.type === 'toggle') return 2;
    return 0;
}
function rowHtml(r, i) {
    const selc = i === ST.sel ? ' sel' : '';
    const pend = r.pending ? ' pending' : '';
    const err = r.err ? ' err' : '';
    const dis = r.type === 'info' ? ' dis' : '';
    let val = '';
    if (r.type === 'head') return `<li data-i="${i}" class="st-head">${esc(r.label)}</li>`;
    if (r.type === 'list' || r.type === 'kcat') {
        const n = r.opts.length, v = Math.max(0, Math.min(n - 1, r.value ?? 0));
        val = `<span class="st-v">${esc(r.opts[v] ?? r.value)}</span><span class="st-n">${v + 1} <i>/</i> ${n}</span>
            <span class="st-a" data-d="-1">${icon('chevL')}</span><span class="st-a" data-d="1">${icon('chev')}</span>`;
    } else if (r.type === 'toggle') {
        val = `<span class="st-v">${r.value ? 'An' : 'Aus'}</span><span class="st-sw${r.value ? ' on' : ''}" data-t="1"><i></i></span>`;
    } else if (r.type === 'slider') {
        const pct = Math.max(0, Math.min(100, ((r.value - r.min) / (r.max - r.min || 1)) * 100));
        val = `<span class="st-bar" data-s="1"><b style="width:${pct}%"></b><i style="left:${pct}%"></i></span><span class="st-num">${r.value ?? 0}</span>`;
    } else if (r.type === 'info') {
        val = `<span class="st-v">${esc(r.text ?? '')}</span>`;
    } else if (r.type === 'key') {
        val = `<span class="key big">${esc(r.value)}</span>`;
    } else if (r.type === 'native' || r.type === 'restore') {
        val = `<span class="st-a">${icon('chev')}</span>`;
    } else if (r.type === 'keys') {
        val = `<span class="st-key${r.k1 ? '' : ' empty'}">${esc(r.k1 || 'Leer')}</span><span class="st-key${r.k2 ? '' : ' empty'}">${esc(r.k2 || 'Leer')}</span><span class="st-trash">${icon('trash')}</span>`;
    }
    const kc = r.type === 'keys' ? ' keys' : '';
    return `<li data-i="${i}" class="st-row${kc}${selc}${pend}${err}${dis}"><span class="st-l">${esc(r.label)}</span><span class="st-r">${val}</span></li>`;
}

function renderSettings() {
    const t = curTab();
    if (!t) return;
    $('stTabs').innerHTML = ST.tabs.map((x, i) => `<span data-i="${i}" class="${i === ST.tab ? 'sel' : ''}">${esc(x.label)}</span>`).join('');
    $('stTabs').querySelectorAll('span').forEach((el) => { el.onclick = () => setTab(+el.dataset.i); });
    $('stSection').textContent = t.label;
    const ul = $('stRows');
    ul.innerHTML = t.rows.map(rowHtml).join('');
    ul.querySelectorAll('li.st-row').forEach((li) => {
        const i = +li.dataset.i;
        if (!selectable(t.rows[i])) return;
        li.onmouseenter = () => { if (ST.sel !== i) { ST.sel = i; sound('nav'); refreshSel(); } };
        li.onclick = (e) => {
            const r = t.rows[i];
            if (e.target.closest('.st-a[data-d]')) { stepRow(r, i, +e.target.closest('.st-a').dataset.d); return; }
            const bar = e.target.closest('.st-bar');
            if (bar && r.type === 'slider') {
                const rc = bar.getBoundingClientRect();
                const f = Math.max(0, Math.min(1, (e.clientX - rc.left) / rc.width));
                setRow(r, i, Math.round(r.min + f * (r.max - r.min)));
                return;
            }
            activateRow2(r, i);
        };
    });
    refreshSel();
}
function refreshSel() {
    const t = curTab();
    $('stRows').querySelectorAll('li.st-row').forEach((li) => li.classList.toggle('sel', +li.dataset.i === ST.sel));
    $('stRows').querySelector(`li[data-i="${ST.sel}"]`)?.scrollIntoView({ block: 'nearest' });
    const r = t.rows[ST.sel];
    const sel = t.rows.filter(selectable);
    $('stCount').innerHTML = `${sel.indexOf(r) + 1} <i>/</i> ${sel.length}`;
    $('stDescTitle').textContent = r ? r.label.toUpperCase() : '';
    $('stDesc').textContent = r ? (r.desc || '') : '';
    const el = $('stRows');
    const thumb = $('stThumb');
    const ratio = el.clientHeight / Math.max(el.scrollHeight, 1);
    thumb.style.height = `${Math.min(100, ratio * 100)}%`;
    thumb.style.top = `${(el.scrollTop / Math.max(el.scrollHeight, 1)) * 100}%`;
}
function setTab(i) {
    if (i === ST.tab || !ST.tabs[i]) return;
    ST.tab = i; ST.sel = 0; sound('side'); renderSettings();
}
function updateRow(i) {
    const li = $('stRows').querySelector(`li[data-i="${i}"]`);
    if (!li) return;
    const tmp = document.createElement('ul');
    tmp.innerHTML = rowHtml(curTab().rows[i], i);
    li.replaceWith(tmp.firstElementChild);
    renderSettings();
}
// Wert setzen: sofort anzeigen, kurz warten (Schieberegler), dann an GTA schicken
function setRow(r, i, v) {
    if (r.type === 'slider') v = Math.max(r.min, Math.min(r.max, v));
    if (r.value === v) return;
    r.value = v; r.err = false;
    sound('side');
    const t = curTab();
    if (t.local) { r.set(v); updateRow(i); return; }
    r.pending = true;
    updateRow(i);
    const key = `${ST.tab}:${i}`;
    clearTimeout(ST.timers[key]);
    const tabIdx = ST.tab;
    ST.timers[key] = setTimeout(() => post('settingsSet', { tab: tabIdx + 1, row: i + 1, value: v }), r.type === 'slider' ? 450 : 150);
}
function stepRow(r, i, d) {
    if (r.type === 'kcat') {
        const t = curTab(), n = r.opts.length;
        t.cat = (t.cat + d + n) % n; sound('side'); buildKeyRows(t); renderSettings(); return;
    }
    if (r.type === 'list') { const n = r.opts.length; setRow(r, i, ((r.value ?? 0) + d + n) % n); }
    else if (r.type === 'toggle') setRow(r, i, r.value ? 0 : 1);
    else if (r.type === 'slider') setRow(r, i, (r.value ?? 0) + d);
}
function activateRow2(r, i) {
    if (r.type === 'native' || r.type === 'keys') { sound('select'); post('settingsNative', { tab: ST.tab + 1, row: i + 1, fivem: !!r.fivem }); return; }
    if (r.type === 'restore') { restoreTab(); return; }
    if (r.type === 'kcat') { stepRow(r, i, 1); return; }
    if (r.type === 'toggle' || r.type === 'list') stepRow(r, i, 1);
}
function settingsValue(d) {
    const t = ST.tabs[d.tab - 1];
    const r = t && t.rows[d.row - 1];
    if (!r) return;
    r.pending = false;
    if (d.value != null) r.value = d.value;
    r.err = !d.ok;
    if (!d.ok) sound('error');
    if (ST.open && ST.tab === d.tab - 1) updateRow(d.row - 1);
}
function restoreTab() {
    const t = curTab();
    if (!t || t.local || t.keys) return;
    sound('select');
    t.rows.forEach((x) => { if (x.def != null && x.value !== x.def) { x.value = x.def; x.pending = true; x.err = false; } });
    renderSettings();
    post('settingsRestore', { tab: ST.tab + 1 });
}
function moveSel(d) {
    const t = curTab(), n = t.rows.length;
    let i = ST.sel;
    for (let k = 0; k < n; k++) { i = (i + d + n) % n; if (selectable(t.rows[i])) break; }
    ST.sel = i; sound('nav'); refreshSel();
}
function settingsKey(e) {
    const t = curTab();
    if (!t) { if (e.key === 'Escape' || e.key === 'Backspace') closeSettings(); return; }
    const n = t.rows.length, r = t.rows[ST.sel];
    switch (e.key) {
        case 'ArrowDown': moveSel(1); break;
        case 'ArrowUp': moveSel(-1); break;
        case 'ArrowLeft': if (r) stepRow(r, ST.sel, -1); break;
        case 'ArrowRight': if (r) stepRow(r, ST.sel, 1); break;
        case 'Enter': if (r) activateRow2(r, ST.sel); break;
        case 'q': case 'Q': case 'PageUp': setTab((ST.tab - 1 + ST.tabs.length) % ST.tabs.length); break;
        case 'e': case 'E': case 'PageDown': case 'Tab': e.preventDefault(); setTab((ST.tab + 1) % ST.tabs.length); break;
        case 'r': case 'R': restoreTab(); break;
        case 'Escape': case 'Backspace': closeSettings(); break;
    }
}
$('stRows').addEventListener('scroll', () => refreshSel());

// =====================================================================
// 3D-KARTE (eigener Renderer) — Pausenkarte (groß) und Minimap (klein)
// =====================================================================
const world = new MapWorld();
const glWrap = $('glWrap');
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
const camera = new THREE.PerspectiveCamera(40, 1, 1, 80000);
camera.up.set(0, 0, 1);
const tmpV = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

const M = {
    mode: null,             // null | 'big' | 'mini'
    on: false,              // Pausenkarte offen
    fromMenu: false,
    pose: null,             // { p:[x,y,z,heading], cam, spd, t, mini }
    blips: [], byId: new Map(), els: new Map(), labelEls: new Map(),
    route: null,
    cat: 'personal', group: null, sel: 0, rows: [], focusId: null, hoverId: null,
    view: { x: 0, y: 0, z: 0, dist: 700, yaw: 0, pitch: 60 },
    want: { x: 0, y: 0, dist: 700, yaw: 0 },
    flat: false,
    drag: null,
    lastMini: 0, lastArea: 0, area: { district: '', county: '' },
    W: 1, H: 1,
};

const rad = (d) => (d * Math.PI) / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const lerpAngle = (a, b, t) => a + ((((b - a + 540) % 360) - 180) * t);
const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const catOf = (id) => S.cfg.categories.find((c) => c.id === id) || S.cfg.categories[0];
const playerXY = () => (M.pose && M.pose.p ? M.pose.p : null);
const playerDist = (b) => { const p = playerXY(); return p ? Math.hypot(b.x - p[0], b.y - p[1]) : null; };
const visibleBlip = (b) => b.big !== false && (M.cat === 'personal' || b.cat === M.cat || b.id === M.focusId || b.f);
const groundZ = (x, y) => (world.ready ? world.ground.at(x, y) : 0);
// Blip-Höhe: echte Z aus dem Spiel, sonst Boden
const blipZ = (b) => { const g = groundZ(b.x, b.y); return (b.z && b.z > g - 8 && b.z < g + 500) ? b.z : g; };

// Laden der Kartendaten (einmalig beim Start der NUI)
world.load((msg) => { const l = $('loading'); l.textContent = msg; l.classList.toggle('hidden', !msg); })
    .then(() => { M.iconsDirty = true; M.blips.forEach((b) => { b.area = null; }); })
    .catch((e) => { $('loading').textContent = `Karte konnte nicht geladen werden: ${e.message}`; $('loading').classList.remove('hidden'); });

// ---- Tag / Nacht nach Spieluhr ----
function dayFactor(t) {
    const d = (S.cfg && S.cfg.day) || { dawn: 6, dusk: 20, fade: 1.5 };
    if (t == null) return 1;
    const up = smooth((t - (d.dawn - d.fade / 2)) / d.fade);
    const down = 1 - smooth((t - (d.dusk - d.fade / 2)) / d.fade);
    return Math.min(up, down);
}

// ---- Modus wechseln (Größe der WebGL-Fläche) ----
function setMode(mode) {
    if (M.mode === mode) return;
    M.mode = mode;
    glWrap.classList.toggle('hidden', !mode);
    glWrap.classList.toggle('big', mode === 'big');
    glWrap.classList.toggle('mini', mode === 'mini');
    $('ring').classList.toggle('hidden', mode !== 'big');
    $('card').classList.add('hidden');
    $('labels').innerHTML = ''; M.labelEls.clear();
    $('marks').innerHTML = ''; M.els.clear();
    resize();
}
function resize() {
    if (!M.mode) return;
    M.W = Math.max(1, glWrap.clientWidth);
    M.H = Math.max(1, glWrap.clientHeight);
    renderer.setSize(M.W, M.H, false);
}
window.addEventListener('resize', resize);

function applyMinimapLayout() {
    const m = S.cfg.minimap || {};
    const s = document.documentElement.style;
    s.setProperty('--mm-left', `${m.left ?? 2.2}vh`);
    s.setProperty('--mm-bottom', `${m.bottom ?? 3.6}vh`);
    s.setProperty('--mm-w', `${m.width ?? 30}vh`);
    s.setProperty('--mm-h', `${m.height ?? 18.5}vh`);
}

// ---- Kamera ----
function pitchFor(dist) {
    const m = S.cfg.map;
    if (M.flat) return 89.9;
    const t = (Math.log(dist) - Math.log(600)) / (Math.log(7000) - Math.log(600));
    return lerp(m.tiltNear, Math.min(89.9, m.tiltFar), smooth(t));
}
function placeCamera(v, fov, far) {
    const p = rad(Math.min(v.pitch, 89.9)), y = rad(v.yaw);
    const fx = -Math.sin(y), fy = Math.cos(y);
    camera.position.set(v.x - fx * v.dist * Math.cos(p), v.y - fy * v.dist * Math.cos(p), v.z + v.dist * Math.sin(p));
    if (v.pitch > 88) camera.up.set(fx, fy, 0); else camera.up.set(0, 0, 1);
    camera.lookAt(v.x, v.y, v.z);
    camera.fov = fov;
    camera.aspect = M.W / M.H;
    camera.near = Math.max(1, v.dist * 0.02);
    camera.far = far;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
}
// Welt -> Pixel in der WebGL-Fläche (null = hinter der Kamera)
function project(x, y, z) {
    tmpV.set(x, y, z).project(camera);
    if (tmpV.z > 1 || tmpV.z < -1) return null;
    return [(tmpV.x + 1) / 2 * M.W, (1 - tmpV.y) / 2 * M.H];
}
// Pixel -> Boden
function unproject(sx, sy) {
    raycaster.setFromCamera(new THREE.Vector2((sx / M.W) * 2 - 1, -(sy / M.H) * 2 + 1), camera);
    groundPlane.constant = -M.view.z;
    const hit = new THREE.Vector3();
    return raycaster.ray.intersectPlane(groundPlane, hit) ? [hit.x, hit.y] : null;
}

// ---- Blip-Icons: html/blips/<sprite>.webp|.png (optional), sonst eingebautes Kategorie-Icon ----
const IMG = new Map();
function probeSprite(s) {
    if (IMG.has(s)) return;
    IMG.set(s, null);
    const tryExt = (ext, next) => {
        const im = new Image();
        im.onload = () => { IMG.set(s, ext); M.iconsDirty = true; };
        im.onerror = next;
        im.src = `blips/${s}.${ext}`;
    };
    tryExt('webp', () => tryExt('png', () => IMG.set(s, false)));
}
function dotHtml(b) {
    probeSprite(b.s);
    const ext = IMG.get(b.s);
    const inner = ext ? `<img src="blips/${b.s}.${ext}">` : icon(catOf(b.cat).icon || 'pin');
    return `<span class="dot" style="background:${esc(b.c)}">${inner}</span>`;
}
function areaOf(b) {
    if (!b.area && world.ready) b.area = world.areaAt(b.x, b.y);
    return b.area || { district: '', county: '' };
}

// ---- Pausenkarte öffnen / schließen ----
function mapOn(d) {
    M.on = true; M.fromMenu = !!d.fromMenu;
    M.cat = 'personal'; M.group = null; M.sel = 0; M.focusId = null; M.hoverId = null; M.flat = false;
    if (d.p) M.pose = Object.assign(M.pose || {}, { p: d.p, cam: d.cam, t: d.t });
    const p = d.p || [0, 0, 0, 0];
    const m = S.cfg.map;
    M.want = { x: p[0], y: p[1], dist: m.zoom, yaw: d.cam || 0 };
    M.view = { x: p[0], y: p[1], z: groundZ(p[0], p[1]), dist: m.zoom * 0.55, yaw: d.cam || 0, pitch: pitchFor(m.zoom) };
    closeMenuUI();
    $('map').classList.remove('hidden');
    setMode('big');
    renderCats(); renderList(true);
    setHints($('mapHints'), [
        ['ZENTRIEREN', 'R', 'r'], ['2D / 3D', 'V', 'v'], ['ZIEL SETZEN', 'ENTER', 'Enter'],
        ['ZIEL LÖSCHEN', 'ENTF', 'Delete'], [M.fromMenu ? 'ZURÜCK' : 'SCHLIESSEN', 'ESC', 'Escape'],
    ]);
}
function mapOff() {
    M.on = false; M.drag = null;
    $('map').classList.add('hidden');
    setMode(M.pose && M.pose.mini ? 'mini' : null);
}

// ---- Kategorien und Liste ----
function renderCats() {
    const ul = $('cats');
    ul.innerHTML = S.cfg.categories.map((c) => `<li data-id="${c.id}" class="${c.id === M.cat ? 'sel' : ''}" title="${esc(c.label)}">${icon(c.icon)}</li>`).join('');
    ul.querySelectorAll('li').forEach((li) => { li.onclick = () => setCat(li.dataset.id); });
}
function setCat(id) {
    if (id === M.cat && !M.group) return;
    M.cat = id; M.group = null; M.sel = 0; M.focusId = null;
    sound('side'); renderCats(); renderList(true);
}
function buildRows() {
    const list = M.blips.filter((b) => b.big !== false && (M.cat === 'personal' || b.cat === M.cat));
    const byDist = (a, b) => (playerDist(a) ?? 0) - (playerDist(b) ?? 0);
    if (M.group) {
        const items = list.filter((b) => b.n === M.group).sort(byDist);
        const rows = [];
        if (items.length > 1) rows.push({ key: 'nearest', label: 'Nächster', blip: items[0] });
        items.forEach((b) => rows.push({ key: `b${b.id}`, label: areaOf(b).district || b.n, blip: b }));
        return rows;
    }
    const groups = new Map();
    list.forEach((b) => { if (!groups.has(b.n)) groups.set(b.n, []); groups.get(b.n).push(b); });
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], 'de')).map(([name, items]) => {
        items.sort(byDist);
        return items.length > 1
            ? { key: `g${name}`, label: name, group: name, blip: items[0], count: items.length }
            : { key: `b${items[0].id}`, label: name, blip: items[0] };
    });
}
function renderList(focusFirst) {
    if (!M.on) return;
    const prevKey = M.rows[M.sel]?.key;
    M.rows = buildRows();
    if (!focusFirst && prevKey) {
        const i = M.rows.findIndex((r) => r.key === prevKey);
        M.sel = i >= 0 ? i : Math.min(M.sel, Math.max(0, M.rows.length - 1));
    }
    $('catTitle').textContent = M.group ? M.group.toUpperCase() : catOf(M.cat).label;
    const ul = $('list');
    if (!M.rows.length) { ul.innerHTML = '<li class="empty">Keine Orte in dieser Kategorie.</li>'; return; }
    ul.innerHTML = M.rows.map((r, i) => {
        const right = r.group ? icon('chev') : `<span class="ds">${fmtDist(playerDist(r.blip))}</span>`;
        return `<li data-i="${i}" class="${i === M.sel && M.focusId ? 'sel' : ''}">${dotHtml(r.blip)}<span class="nm">${esc(r.label)}</span>${right}</li>`;
    }).join('');
    ul.querySelectorAll('li[data-i]').forEach((li) => { li.onclick = () => { M.sel = +li.dataset.i; activateRow(); }; });
}
function activateRow() {
    const r = M.rows[M.sel];
    if (!r) return;
    if (r.group) { M.group = r.group; M.sel = 0; sound('select'); renderList(true); selectRow(0); return; }
    focusBlip(r.blip, true);
}
function selectRow(i) {
    if (!M.rows.length) return;
    M.sel = (i + M.rows.length) % M.rows.length;
    focusBlip(M.rows[M.sel].blip, true);
    $('list').querySelector(`li[data-i="${M.sel}"]`)?.scrollIntoView({ block: 'nearest' });
}
function focusBlip(b, fly) {
    M.focusId = b ? b.id : null;
    if (b && fly) { M.want.x = b.x; M.want.y = b.y; M.want.dist = Math.min(M.want.dist, S.cfg.map.zoom); }
    sound('nav');
    renderList();
}
function setWaypoint() {
    const b = M.byId.get(M.focusId ?? M.hoverId);
    if (b) { post('waypoint', { x: b.x, y: b.y }); return; }
    post('waypoint', { x: M.view.x, y: M.view.y });
}
function mapBack() {
    if (M.group) { M.group = null; M.sel = 0; M.focusId = null; sound('back'); renderList(true); return; }
    if (M.focusId) { M.focusId = null; sound('back'); renderList(); return; }
    post('mapBack');
}
function recenter() {
    const p = playerXY();
    if (p) { M.want.x = p[0]; M.want.y = p[1]; sound('select'); }
}
function zoomBy(n) {
    const m = S.cfg.map;
    M.want.dist = Math.max(m.minZoom, Math.min(m.maxZoom, M.want.dist * Math.pow(m.zoomStep, n)));
}

function mapKey(e) {
    const k = e.key;
    if (k === 'Escape' || k === 'Backspace') mapBack();
    else if (k === 'p' || k === 'P') post('close');
    else if (k === 'v' || k === 'V') { M.flat = !M.flat; world.setFlat(M.flat); sound('select'); }
    else if (k === 'r' || k === 'R') recenter();
    else if (k === 'Delete') post('clearWaypoint');
    else if (k === 'Enter') {
        const r = M.rows[M.sel];
        if (r?.group && M.focusId === r.blip.id) activateRow();
        else setWaypoint();
    } else if (k === 'ArrowDown') selectRow(M.focusId ? M.sel + 1 : 0);
    else if (k === 'ArrowUp') selectRow(M.focusId ? M.sel - 1 : -1);
    else if (k === 'ArrowLeft' || k === 'ArrowRight') {
        const cats = S.cfg.categories, i = cats.findIndex((c) => c.id === M.cat);
        setCat(cats[(i + (k === 'ArrowRight' ? 1 : -1) + cats.length) % cats.length].id);
    } else if (k === '+' || k === 'PageUp') zoomBy(-1);
    else if (k === '-' || k === 'PageDown') zoomBy(1);
    else if (k === 'q' || k === 'Q') M.want.yaw += 15;
    else if (k === 'e' || k === 'E') M.want.yaw -= 15;
}

// ---- Maus auf der Pausenkarte ----
const layer = $('layer');
layer.addEventListener('mousedown', (e) => { M.drag = { btn: e.button, moved: 0 }; layer.classList.add('drag'); });
window.addEventListener('mousemove', (e) => {
    if (!M.drag || !M.on) return;
    const dx = e.movementX, dy = e.movementY;
    M.drag.moved += Math.abs(dx) + Math.abs(dy);
    if (M.drag.btn === 0) {
        const v = M.view;
        const mpp = (2 * v.dist * Math.tan(rad(S.cfg.map.fov) / 2)) / M.H;
        const y = rad(v.yaw), fx = -Math.sin(y), fy = Math.cos(y), rx = Math.cos(y), ry = Math.sin(y);
        const tilt = Math.max(0.35, Math.sin(rad(v.pitch)));
        M.want.x += (-rx * dx + fx * dy / tilt) * mpp;
        M.want.y += (-ry * dx + fy * dy / tilt) * mpp;
        M.want.x = Math.max(-4500, Math.min(4700, M.want.x));
        M.want.y = Math.max(-4500, Math.min(8600, M.want.y));
        // beim Ziehen sofort folgen (kein Nachziehen)
        v.x = lerp(v.x, M.want.x, 0.6); v.y = lerp(v.y, M.want.y, 0.6);
    } else if (M.drag.btn === 2) {
        M.want.yaw -= dx * 0.3;
    }
});
window.addEventListener('mouseup', (e) => {
    if (!M.drag) return;
    const d = M.drag; M.drag = null; layer.classList.remove('drag');
    if (!M.on || d.moved > 5 || d.btn !== 0) return;
    const b = blipAtScreen(e.clientX, e.clientY, 26);
    if (b) {
        const i = M.rows.findIndex((r) => r.blip.id === b.id);
        if (i >= 0) M.sel = i;
        focusBlip(b, true);
    }
});
layer.addEventListener('dblclick', (e) => {
    const b = blipAtScreen(e.clientX, e.clientY, 26);
    if (b) { post('waypoint', { x: b.x, y: b.y }); return; }
    const g = unproject(e.clientX, e.clientY);
    if (g) post('waypoint', { x: g[0], y: g[1] });
});
layer.addEventListener('wheel', (e) => zoomBy(e.deltaY > 0 ? 1 : -1), { passive: true });
window.addEventListener('contextmenu', (e) => e.preventDefault());

function blipAtScreen(sx, sy, maxPx) {
    let best = null, bd = maxPx;
    for (const b of M.blips) {
        if (!visibleBlip(b)) continue;
        const s = b._s;
        if (!s) continue;
        const d = Math.hypot(s[0] - sx, s[1] - 14 - sy);
        if (d < bd) { bd = d; best = b; }
    }
    return best;
}

// ---- Overlay: Marker, Labels, Route ----
function marker(map, parent, id, cls, html) {
    let el = map.get(id);
    if (!el) {
        el = document.createElement('div');
        el.className = cls;
        el.innerHTML = html;
        parent.appendChild(el);
        map.set(id, el);
    }
    el._seen = true;
    return el;
}
function sweep(map) {
    map.forEach((el, id) => { if (!el._seen) { el.remove(); map.delete(id); } else el._seen = false; });
}

function drawOverlay(big) {
    if (M.iconsDirty) { M.iconsDirty = false; $('marks').innerHTML = ''; M.els.clear(); $('card').dataset.id = ''; renderList(); }
    const W = M.W, H = M.H, cx = W / 2, cy = H / 2, pad = 40;
    let hover = null, hoverD = 34;

    // Blips
    for (const b of M.blips) {
        b._s = null;
        if (big ? !visibleBlip(b) : b.mini === false) continue;
        const s = project(b.x, b.y, blipZ(b) + 2);
        if (!s || s[0] < -pad || s[0] > W + pad || s[1] < -pad || s[1] > H + pad) continue;
        b._s = s;
        const el = marker(M.els, $('marks'), b.id, 'blip', dotHtml(b) + '<span class="dist"></span>');
        const focus = big && b.id === (M.focusId ?? M.hoverId);
        el.style.zIndex = focus ? 50 : 10;
        el.style.transform = `translate(${s[0]}px, ${s[1]}px) translate(-50%, -100%)`;
        el.classList.toggle('focus', focus);
        el.classList.toggle('flash', !!b.f);
        const dot = el.firstElementChild;
        if (dot && dot.style.background !== b.c) dot.style.background = b.c;
        const dd = el.lastElementChild;
        const txt = focus ? fmtDist(playerDist(b)) : '';
        if (dd.textContent !== txt) dd.textContent = txt;
        if (big && !M.drag) {
            const d = Math.hypot(s[0] - cx, s[1] - 14 - cy);
            if (d < hoverD) { hoverD = d; hover = b; }
        }
    }
    if (big) M.hoverId = hover ? hover.id : null;
    $('ring').classList.toggle('on', !!hover);

    // Spieler-Pfeil
    const p = playerXY();
    if (p) {
        const pz = groundZ(p[0], p[1]) + 1;
        const s = project(p[0], p[1], pz);
        if (s) {
            const h = rad(p[3] || 0);
            const a = project(p[0] - Math.sin(h) * 10, p[1] + Math.cos(h) * 10, pz);
            const ang = a ? Math.atan2(a[0] - s[0], -(a[1] - s[1])) * 180 / Math.PI : 0;
            const el = marker(M.els, $('marks'), 'player', 'player', `<i>${icon('arrow')}</i>`);
            el.style.zIndex = 40;
            el.style.transform = `translate(${s[0]}px, ${s[1]}px) translate(-50%, -50%) rotate(${ang}deg)`;
        }
    }

    // Route + Wegpunkt
    const line = $('routeLine');
    const r = M.route;
    if (r && r.wp) {
        const wz = groundZ(r.wp[0], r.wp[1]);
        const w = project(r.wp[0], r.wp[1], wz + 2);
        if (w) {
            const el = marker(M.els, $('marks'), 'wp', 'wp', '<i></i><span></span>');
            el.style.zIndex = 45;
            el.style.transform = `translate(${w[0]}px, ${w[1]}px) translate(-50%, -100%)`;
            const t = big ? (r.len ? `Route ${fmtDist(r.len)}` : '') : '';
            const sp = el.lastElementChild;
            if (sp.textContent !== t) sp.textContent = t;
        }
        const pts = [];
        const src = r.pts && r.pts.length ? r.pts : (p ? [[p[0], p[1], p[2]], [r.wp[0], r.wp[1], wz]] : []);
        for (const q of src) {
            const s = project(q[0], q[1], Math.max(q[2], groundZ(q[0], q[1])) + 1.5);
            if (s) pts.push(`${s[0].toFixed(1)},${s[1].toFixed(1)}`);
        }
        line.setAttribute('points', pts.join(' '));
    } else line.setAttribute('points', '');

    sweep(M.els);

    // Stadtteil-Namen
    if (big && S.cfg.map.labels && world.ready) {
        const d = M.view.dist;
        const list = d > 9000 ? world.counties : d > 700 ? world.zones : [];
        for (const z of list) {
            const s = project(z.cx, z.cy, groundZ(z.cx, z.cy));
            if (!s || s[0] < 0 || s[0] > W || s[1] < 0 || s[1] > H) continue;
            const el = marker(M.labelEls, $('labels'), z.name, 'zlabel', esc(z.name));
            el.style.transform = `translate(${s[0]}px, ${s[1]}px) translate(-50%, -50%)`;
        }
    }
    sweep(M.labelEls);

    // Infokarte
    const card = $('card');
    const fb = big ? M.byId.get(M.focusId ?? M.hoverId) : null;
    if (fb && fb._s) {
        const c = catOf(fb.cat), ar = areaOf(fb);
        if (card.dataset.id !== String(fb.id)) {
            card.dataset.id = fb.id;
            card.innerHTML = `<div class="hd">${dotHtml(fb)}<b>${esc(fb.n)}</b></div>
                <div class="meta"><span>${esc(ar.district || ar.county || '–')}</span><span class="cd"></span><span>${esc(c.label)}</span></div>
                ${fb.t ? `<div class="txt">${esc(fb.t)}</div>` : ''}
                <div class="act"><span class="key">ENTER</span> ZIEL SETZEN</div>`;
        }
        card.querySelector('.cd').textContent = fmtDist(playerDist(fb));
        const left = Math.min(fb._s[0] + 34, W - card.offsetWidth - 20);
        card.style.transform = `translate(${left}px, ${fb._s[1] - 70}px)`;
        card.classList.remove('hidden');
    } else { card.classList.add('hidden'); card.dataset.id = ''; }

    // Kompass + Gebiet
    if (big) {
        $('compass').style.transform = `rotate(${M.view.yaw}deg)`;
        const now = performance.now();
        if (now - M.lastArea > 200 && world.ready) {
            M.lastArea = now;
            M.area = world.areaAt(M.view.x, M.view.y);
            $('areaName').textContent = M.area.district || '';
            $('countyName').textContent = M.area.county || '';
        }
    }
}

// ---- Render-Schleife ----
let lastFrame = performance.now();
function frame(now) {
    const dt = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;
    if (M.mode === 'big' && world.ready) {
        const v = M.view, w = M.want, k = 1 - Math.exp(-dt * 9);
        v.x = lerp(v.x, w.x, k); v.y = lerp(v.y, w.y, k);
        v.dist = lerp(v.dist, w.dist, k);
        v.yaw = lerpAngle(v.yaw, w.yaw, k);
        v.pitch = lerp(v.pitch, pitchFor(v.dist), k);
        v.z = lerp(v.z, groundZ(v.x, v.y), k);
        renderMap(v, S.cfg.map.fov, v.dist * 40 + 8000, v.dist * 4, v.dist * 12);
        drawOverlay(true);
    } else if (M.mode === 'mini' && world.ready && M.pose && M.pose.p) {
        const fps = (S.cfg.minimap && S.cfg.minimap.fps) || 30;
        if (now - M.lastMini >= 1000 / fps - 2) {
            M.lastMini = now;
            const mm = S.cfg.minimap, p = M.pose.p, v = M.view;
            const want = Math.min(mm.maxZoom, mm.zoom + (M.pose.spd || 0) * mm.speedZoom);
            const k = 1 - Math.exp(-Math.max(dt, 1 / fps) * 6);
            v.dist = lerp(v.dist || want, want, k);
            v.yaw = lerpAngle(v.yaw, M.pose.cam || 0, 1 - Math.exp(-Math.max(dt, 1 / fps) * 14));
            v.pitch = mm.tilt;
            // Spieler etwas unterhalb der Mitte
            const y = rad(v.yaw), off = v.dist * 0.22;
            v.x = p[0] - Math.sin(y) * off; v.y = p[1] + Math.cos(y) * off;
            v.z = groundZ(p[0], p[1]);
            renderMap(v, 50, v.dist * 6, v.dist * 2.2, v.dist * 4.5);
            drawOverlay(false);
        }
    }
    requestAnimationFrame(frame);
}
function renderMap(v, fov, far, fogNear, fogFar) {
    const day = dayFactor(M.pose && M.pose.t);
    world.day = day;
    world.lift = v.dist * 0.0005;
    world.rise = v.dist < 3500 ? 1 : Math.max(0.2, 1 - (v.dist - 3500) / 9000);
    world.fog(fogNear, fogFar);
    renderer.setClearColor(world.background(day));
    placeCamera(v, fov, far);
    renderer.render(world.scene, camera);
}
requestAnimationFrame(frame);

function setBlips(list) {
    const old = M.byId;
    M.blips = list || [];
    M.byId = new Map(M.blips.map((b) => {
        const o = old.get(b.id);
        if (o && o.x === b.x && o.y === b.y) b.area = o.area; // Gebiet behalten
        return [b.id, b];
    }));
    if (M.focusId && !M.byId.has(M.focusId)) M.focusId = null;
    if (M.on) renderList();
}

function onPose(d) {
    if (d.p) M.pose = d;
    else if (M.pose) M.pose.mini = false;
    if (!M.on) setMode(d.mini && d.p ? 'mini' : null);
}

// =====================================================================
// FREIE KAMERA (HUD)
// =====================================================================
function freecam(d) {
    if (!d.on) { $('freecam').classList.add('hidden'); return; }
    closeMenuUI();
    $('freecam').classList.remove('hidden');
    $('grid').classList.toggle('hidden', !d.grid);
    S.cam.fov = d.fov; S.cam.roll = d.roll; S.cam.grid = d.grid;
    const hud = $('fcHud');
    hud.classList.toggle('hidden', !!d.hidden);
    hud.innerHTML = `<h3>FREIE KAMERA</h3>
        <div class="r"><span>Geschwindigkeit</span><span>${d.speed}%</span></div>
        <div class="r"><span>Sichtfeld (Mausrad)</span><span>${d.fov}°</span></div>
        <div class="r"><span>Rollwinkel (Q / E)</span><span>${d.roll}°</span></div>
        <div class="r"><span>Raster (G)</span><span>${d.grid ? 'AN' : 'AUS'}</span></div>
        <div class="r"><span>Hinweise ausblenden</span><span class="key">H</span></div>
        <div class="r"><span>Zurück</span><span class="key">ESC</span></div>`;
}


// =====================================================================
// NACHRICHTEN & TASTEN
// =====================================================================
function handleKey(e) {
    if (!S.cfg) return;
    if (M.on) { mapKey(e); return; }
    if (ST.open) { settingsKey(e); return; }
    if (S.open) menuKey(e);
}
window.addEventListener('keydown', (e) => {
    if (e.repeat && !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-', 'q', 'e', 'Q', 'E'].includes(e.key)) return;
    if (['ArrowUp', 'ArrowDown', 'Backspace', ' '].includes(e.key)) e.preventDefault();
    handleKey(e);
});

const pending = [];
function onMessage(d) {
    switch (d.action) {
        case 'open': mapOff(); openMenu(d.page, d.info); break;
        case 'close': if (ST.open) { ST.open = false; $('settings').classList.add('hidden'); } closeMenuUI(); if (M.on) mapOff(); $('freecam').classList.add('hidden'); break;
        case 'hide': ST.open = false; $('settings').classList.add('hidden'); closeMenuUI(); break;
        case 'map': if (d.on) mapOn(d); else mapOff(); break;
        case 'pose': onPose(d); break;
        case 'blips': setBlips(d.list); break;
        case 'route': M.route = d.route || null; break;
        case 'settingsValue': settingsValue(d); break;
        case 'freecam': freecam(d); break;
        case 'camOpts': if (d.opts) { Object.assign(S.cam, { speed: d.opts.speed, fov: Math.round(d.opts.fov), roll: Math.round(d.opts.roll), grid: !!d.opts.grid }); renderRows(); } break;
    }
}
window.addEventListener('message', (ev) => {
    const d = ev.data || {};
    if (!S.cfg) { pending.push(d); return; } // Nachrichten vor der Konfiguration merken
    onMessage(d);
});

function applyConfig(c) {
    S.cfg = c;
    document.documentElement.style.setProperty('--accent', c.accent || '#ee7bb2');
    document.documentElement.style.setProperty('--wp', (c.route && c.route.colour) || '#5fe3c8');
    $('brand').innerHTML = `${esc(c.serverName)}<small>PAUSENMENÜ</small>`;
    Object.assign(S.cam, { speed: c.freecam.speed, fov: c.freecam.fov, roll: c.freecam.roll, grid: c.freecam.grid });
    applyMinimapLayout();
    while (pending.length) onMessage(pending.shift());
}
window.__applyConfig = applyConfig; // für Tests im Browser
(function askConfig() {
    post('ready').then((c) => { if (c && c.items) applyConfig(c); else setTimeout(askConfig, 1500); });
})();
