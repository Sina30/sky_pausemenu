-- sky_pausemenu: Freie Kamera für Screenshots
-- WASD bewegen, Shift hoch, Strg runter, Maus umsehen, Mausrad = Sichtfeld, Q/E = Rollwinkel,
-- G = Raster, H = Hinweise ausblenden, ESC/Backspace = zurück ins Menü

local cfg = Config.FreeCam
local cam = nil
local opts = { speed = 100, fov = cfg.fov, roll = 0.0, grid = false }

local C = {
    W = 32, S = 33, A = 34, D = 35,
    UP = 21, DOWN = 36,             -- Shift / Strg
    ROLL_L = 44, ROLL_R = 38,       -- Q / E
    LOOK_X = 1, LOOK_Y = 2,
    WHEEL_UP = 241, WHEEL_DOWN = 242,
    GRID = 47,                      -- G
    HIDE = 74,                      -- H
    BACK = 177, ESC = 200,
}

local function clamp(v, a, b) return math.max(a, math.min(b, v)) end

local function vectors(rot)
    local p, y = math.rad(rot.x), math.rad(rot.z)
    local fwd = vector3(-math.sin(y) * math.cos(p), math.cos(y) * math.cos(p), math.sin(p))
    local right = vector3(math.cos(y), math.sin(y), 0.0)
    return fwd, right
end

local function hud(hidden)
    SendNUIMessage({
        action = 'freecam', on = true, hidden = hidden,
        grid = opts.grid, fov = math.floor(opts.fov + 0.5), roll = math.floor(opts.roll + 0.5), speed = opts.speed,
    })
end

function PM.FreecamStart(o)
    opts.speed = clamp(tonumber(o.speed) or 100, 10, 300)
    opts.fov = clamp(tonumber(o.fov) or cfg.fov, cfg.minFov, cfg.maxFov)
    opts.roll = clamp(tonumber(o.roll) or 0.0, -45.0, 45.0)
    opts.grid = o.grid == true

    PM.state = 'freecam'
    SetNuiFocus(false, false)
    TriggerScreenblurFadeOut(150)

    local pos = GetGameplayCamCoord()
    local rot = GetGameplayCamRot(2)
    cam = CreateCam('DEFAULT_SCRIPTED_CAMERA', true)
    SetCamCoord(cam, pos.x, pos.y, pos.z)
    SetCamRot(cam, rot.x, opts.roll, rot.z, 2)
    SetCamFov(cam, opts.fov)
    RenderScriptCams(true, true, 300, true, false)

    local hidden = false
    hud(hidden)

    CreateThread(function()
        local p = pos
        local r = vector3(rot.x, opts.roll, rot.z)
        local lastHud = 0
        while PM.state == 'freecam' and cam do
            Wait(0)
            DisableAllControlActions(0)
            HideHudAndRadarThisFrame()
            local dt = GetFrameTime()

            -- umsehen
            local lx = GetDisabledControlNormal(0, C.LOOK_X)
            local ly = GetDisabledControlNormal(0, C.LOOK_Y)
            local zoomFactor = opts.fov / cfg.fov
            r = vector3(
                clamp(r.x - ly * cfg.look * 1.5 * zoomFactor, -89.0, 89.0),
                r.y,
                r.z - lx * cfg.look * 1.5 * zoomFactor
            )

            -- bewegen
            local fwd, right = vectors(r)
            local speed = cfg.speed * (opts.speed / 100.0) * dt
            local move = vector3(0.0, 0.0, 0.0)
            if IsDisabledControlPressed(0, C.W) then move = move + fwd end
            if IsDisabledControlPressed(0, C.S) then move = move - fwd end
            if IsDisabledControlPressed(0, C.D) then move = move + right end
            if IsDisabledControlPressed(0, C.A) then move = move - right end
            if IsDisabledControlPressed(0, C.UP) then move = move + vector3(0.0, 0.0, 1.0) end
            if IsDisabledControlPressed(0, C.DOWN) then move = move - vector3(0.0, 0.0, 1.0) end
            p = p + move * speed

            -- Radius um den Spieler
            if cfg.radius > 0 then
                local pp = GetEntityCoords(PlayerPedId())
                local d = p - pp
                local len = #d
                if len > cfg.radius then p = pp + d / len * cfg.radius end
            end

            -- Rollwinkel und Sichtfeld
            local changed = false
            if IsDisabledControlPressed(0, C.ROLL_L) then opts.roll = clamp(opts.roll - 30.0 * dt, -45.0, 45.0); changed = true end
            if IsDisabledControlPressed(0, C.ROLL_R) then opts.roll = clamp(opts.roll + 30.0 * dt, -45.0, 45.0); changed = true end
            if IsDisabledControlJustPressed(0, C.WHEEL_UP) then opts.fov = clamp(opts.fov - 3.0, cfg.minFov, cfg.maxFov); changed = true end
            if IsDisabledControlJustPressed(0, C.WHEEL_DOWN) then opts.fov = clamp(opts.fov + 3.0, cfg.minFov, cfg.maxFov); changed = true end
            if IsDisabledControlJustPressed(0, C.GRID) then opts.grid = not opts.grid; changed = true; PM.Sound('nav') end
            if IsDisabledControlJustPressed(0, C.HIDE) then hidden = not hidden; changed = true end
            r = vector3(r.x, opts.roll, r.z)

            SetCamCoord(cam, p.x, p.y, p.z)
            SetCamRot(cam, r.x, r.y, r.z, 2)
            SetCamFov(cam, opts.fov)
            SetFocusPosAndVel(p.x, p.y, p.z, 0.0, 0.0, 0.0)

            local now = GetGameTimer()
            if changed and now - lastHud > 50 then
                lastHud = now
                hud(hidden)
            end

            if IsDisabledControlJustReleased(0, C.ESC) or IsDisabledControlJustReleased(0, C.BACK) then
                PM.FreecamStop()
                PM.OpenMenu('camera')
                SendNUIMessage({ action = 'camOpts', opts = opts })
                break
            end
        end
    end)
end

function PM.FreecamStop()
    if cam then
        RenderScriptCams(false, true, 300, true, false)
        DestroyCam(cam, false)
        cam = nil
    end
    ClearFocus()
    SendNUIMessage({ action = 'freecam', on = false })
end

RegisterNUICallback('freecam', function(d, cb)
    cb(1)
    if PM.state ~= 'menu' then return end
    PM.Sound('select')
    PM.FreecamStart(type(d) == 'table' and d or {})
end)
