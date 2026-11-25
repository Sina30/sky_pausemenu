-- sky_pausemenu: Daten für die 3D-Karte und die 3D-Minimap
-- Die Karte selbst wird in der NUI gerendert (html/map3d.js). Lua liefert nur:
-- Spieler-Pose, Kamerarichtung, Uhrzeit, alle Blips, Wegpunkt und die echte GPS-Route.

local fromMenu = false

local spriteCat = {}
for _, c in ipairs(Config.Categories) do
    for _, s in ipairs(c.sprites or {}) do
        if not spriteCat[s] then spriteCat[s] = c.id end
    end
end

local function hexColour(idx)
    local r, g, b = GetHudColour(idx)
    return ('#%02x%02x%02x'):format(r or 255, g or 255, b or 255)
end

local function blipName(blip, sprite)
    local info = PM.blipInfo[blip]
    if info and info.n then return info.n, info.t end
    if Config.BlipNames[sprite] then return Config.BlipNames[sprite] end
    -- GTA-eigener Name des Sprites (Spielsprache)
    local label = GetLabelText(('BLIP_%d'):format(sprite))
    if label ~= 'NULL' and label ~= '' then return label end
    return GetLabelText('BLIP_DEFAULT') ~= 'NULL' and GetLabelText('BLIP_DEFAULT') or 'Ort'
end

-- alle Blips im Spiel (jeder einzeln)
local function scanBlips()
    local list = {}
    local mine = GetMainPlayerBlipId()
    for sprite = 0, 1000 do
        if not Config.HiddenSprites[sprite] then
            local b = GetFirstBlipInfoId(sprite)
            while DoesBlipExist(b) do
                local disp = GetBlipInfoIdDisplay(b)
                -- 0 = versteckt, 5 = nur Minimap
                if b ~= mine and disp ~= 0 and GetBlipAlpha(b) > 0 then
                    local c = GetBlipInfoIdCoord(b)
                    local name, text = blipName(b, sprite)
                    list[#list + 1] = {
                        id = b, s = sprite,
                        x = c.x, y = c.y, z = c.z,
                        c = hexColour(GetBlipHudColour(b)),
                        n = name, t = text,
                        cat = spriteCat[sprite] or 'personal',
                        f = IsBlipFlashing(b) or nil,
                        mini = disp ~= 3 or nil,      -- 3 = nur große Karte
                        big = disp ~= 5 or nil,       -- 5 = nur Minimap
                    }
                end
                b = GetNextBlipInfoId(sprite)
            end
        end
    end
    return list
end

-- Punkte entlang der GTA-Route in einem GPS-Slot sammeln (0 = Wegpunkt, 1 = Blip-Route)
-- Ende der Route: GTA liefert keinen Punkt mehr, der Punkt bewegt sich nicht mehr oder das Ziel ist erreicht.
local function sampleRoute(slot, wx, wy, step, maxPoints)
    local pts, len = {}, 0.0
    local px, py
    local still = 0
    for i = 0, maxPoints - 1 do
        local ok, pos = GetPosAlongGpsTypeRoute(true, i * step, slot)
        if not ok or not pos or (pos.x == 0.0 and pos.y == 0.0) then break end
        if px then
            local seg = math.sqrt((pos.x - px) ^ 2 + (pos.y - py) ^ 2)
            if seg < 0.5 then
                still = still + 1
                if still >= 2 then break end -- Routenende erreicht
            else
                still = 0
                len = len + seg
            end
        end
        pts[#pts + 1] = { pos.x, pos.y, pos.z }
        px, py = pos.x, pos.y
        if math.sqrt((pos.x - wx) ^ 2 + (pos.y - wy) ^ 2) < step * 0.75 then break end
    end
    return pts, len
end

-- echte GPS-Route zum Wegpunkt (folgt den Straßen wie die GTA-Minimap)
local function gpsRoute()
    if not IsWaypointActive() then return nil end
    local wp = GetBlipInfoIdCoord(GetFirstBlipInfoId(8))
    local route = { wp = { wp.x, wp.y }, pts = {}, len = 0 }
    local step, maxPoints = Config.Route.step, Config.Route.maxPoints
    -- lange Strecken: Abstand der Punkte vergrößern, bis die ganze Route hineinpasst
    for _ = 1, 4 do
        local pts, len = sampleRoute(0, wp.x, wp.y, step, maxPoints)
        route.pts, route.len = pts, len
        if #pts < maxPoints then break end
        step = step * 2
    end
    if #route.pts < 2 then route.pts = {} end
    return route
end

local function miniVisible()
    return Config.Minimap.enabled
        and PM.state == nil
        and not IsPauseMenuActive()
        and not IsHudHidden()
        and not PM.miniHidden
        and (not Config.Minimap.onlyInVehicle or IsPedInAnyVehicle(PlayerPedId(), false))
end

-- Pose ~30x pro Sekunde (für Minimap und große Karte)
CreateThread(function()
    local wasMini = nil
    while true do
        local mini = miniVisible()
        local big = PM.state == 'map'
        if mini or big then
            local ped = PlayerPedId()
            local p = GetEntityCoords(ped)
            local veh = GetVehiclePedIsIn(ped, false)
            SendNUIMessage({
                action = 'pose',
                p = { p.x, p.y, p.z, GetEntityHeading(ped) },
                cam = GetGameplayCamRot(2).z,
                spd = veh ~= 0 and GetEntitySpeed(veh) or 0.0,
                t = GetClockHours() + GetClockMinutes() / 60.0,
                mini = mini,
            })
            wasMini = mini
            Wait(1000 // math.max(1, Config.Minimap.fps))
        else
            if wasMini ~= false then
                SendNUIMessage({ action = 'pose', mini = false })
                wasMini = false
            end
            Wait(250)
        end
    end
end)

-- GTA-Minimap ausblenden, solange die eigene aktiv ist
CreateThread(function()
    if not (Config.Minimap.enabled and Config.Minimap.hideNative) then return end
    while true do
        if PM.state == nil and not PM.miniHidden then
            DisplayRadar(false)
            Wait(0)
        else
            Wait(250)
        end
    end
end)

-- Blips + Route 1x pro Sekunde
CreateThread(function()
    local lastRoute = nil
    while true do
        if Config.Minimap.enabled or PM.state == 'map' then
            SendNUIMessage({ action = 'blips', list = scanBlips() })
            local r = gpsRoute()
            if r or lastRoute then
                SendNUIMessage({ action = 'route', route = r })
            end
            lastRoute = r
        end
        Wait(1000)
    end
end)

function PM.MapStart(menu)
    fromMenu = menu
    PM.state = 'map'
    TriggerScreenblurFadeOut(150)
    SetNuiFocus(true, true)
    local ped = PlayerPedId()
    local p = GetEntityCoords(ped)
    SendNUIMessage({ action = 'blips', list = scanBlips() })
    SendNUIMessage({ action = 'route', route = gpsRoute() })
    SendNUIMessage({
        action = 'map', on = true, fromMenu = menu,
        p = { p.x, p.y, p.z, GetEntityHeading(ped) },
        cam = GetGameplayCamRot(2).z,
        t = GetClockHours() + GetClockMinutes() / 60.0,
    })
    PM.Sound('select')
end

function PM.MapStop()
    SendNUIMessage({ action = 'map', on = false })
end

RegisterNUICallback('waypoint', function(d, cb)
    cb(1)
    local x, y = tonumber(d.x), tonumber(d.y)
    if not x or not y then return end
    SetNewWaypoint(x, y)
    PM.Sound('waypoint')
    Wait(150)
    SendNUIMessage({ action = 'route', route = gpsRoute() })
end)

RegisterNUICallback('clearWaypoint', function(_, cb)
    cb(1)
    if IsWaypointActive() then
        SetWaypointOff()
        PM.Sound('back')
        SendNUIMessage({ action = 'route', route = nil })
    end
end)

RegisterNUICallback('mapBack', function(_, cb)
    cb(1)
    if PM.state ~= 'map' then return end
    PM.MapStop()
    if fromMenu then
        PM.state = 'menu'
        if Config.Blur then TriggerScreenblurFadeIn(250) end
        SendNUIMessage({ action = 'open', page = 'home' })
        PM.Sound('back')
    else
        PM.CloseAll()
    end
end)

-- andere Scripts können die eigene Minimap kurz ausblenden (z. B. für Cutscenes)
exports('SetMinimapHidden', function(state) PM.miniHidden = state and true or false end)

-- Position/Sichtbarkeit der 3D-Minimap für HUD-Scripts (z. B. sky_hud), Werte in vh
exports('GetMinimapState', function()
    local m = Config.Minimap
    return {
        visible = miniVisible(),
        left = m.left or 2.2, bottom = m.bottom or 3.6,
        width = m.width or 30, height = m.height or 18.5,
    }
end)

AddEventHandler('onResourceStop', function(res)
    if res == GetCurrentResourceName() then DisplayRadar(true) end
end)
