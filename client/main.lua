-- sky_pausemenu: Hauptsteuerung (ESC/P abfangen, Menü öffnen/schließen, Spiel-Aktionen, Sounds)

PM = {
    state = nil,        -- nil | 'menu' | 'map' | 'freecam' | 'native'
    lastClose = 0,
    blipInfo = {},      -- [blipHandle] = { n = name, t = text } (über Export gesetzt)
}

local SOUNDS = {
    nav    = { 'NAV_UP_DOWN', 'HUD_FRONTEND_DEFAULT_SOUNDSET' },
    side   = { 'NAV_LEFT_RIGHT', 'HUD_FRONTEND_DEFAULT_SOUNDSET' },
    select = { 'SELECT', 'HUD_FRONTEND_DEFAULT_SOUNDSET' },
    back   = { 'BACK', 'HUD_FRONTEND_DEFAULT_SOUNDSET' },
    error  = { 'ERROR', 'HUD_FRONTEND_DEFAULT_SOUNDSET' },
    open   = { 'SELECT', 'HUD_FRONTEND_DEFAULT_SOUNDSET' },
    close  = { 'QUIT', 'HUD_FRONTEND_DEFAULT_SOUNDSET' },
    waypoint = { 'WAYPOINT_SET', 'HUD_FRONTEND_DEFAULT_SOUNDSET' },
}

function PM.Sound(name)
    if not Config.Sounds then return end
    local s = SOUNDS[name]
    if s then PlaySoundFrontend(-1, s[1], s[2], true) end
end

function PM.Zone(x, y, z)
    local label = GetLabelText(GetNameOfZone(x, y, z or 0.0))
    if label == 'NULL' then return '' end
    return label
end

local function playerInfo()
    local ped = PlayerPedId()
    local c = GetEntityCoords(ped)
    return {
        name = GetPlayerName(PlayerId()),
        id = GetPlayerServerId(PlayerId()),
        hour = GetClockHours(),
        minute = GetClockMinutes(),
        zone = PM.Zone(c.x, c.y, c.z),
    }
end

-- Menü öffnen (page = 'home' oder ein Menüpunkt)
function PM.OpenMenu(page)
    PM.state = 'menu'
    if Config.Blur then TriggerScreenblurFadeIn(250) end
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'open', page = page or 'home', info = playerInfo() })
    PM.Sound('open')
end

-- alles schließen und zurück ins Spiel
function PM.CloseAll()
    if PM.state == 'map' then PM.MapStop() end
    if PM.state == 'freecam' then PM.FreecamStop() end
    PM.state = nil
    SetNuiFocus(false, false)
    TriggerScreenblurFadeOut(250)
    SendNUIMessage({ action = 'close' })
    PM.lastClose = GetGameTimer()
    PM.Sound('close')
end

-- GTA-eigenes Frontend-Menü öffnen (echte Einstellungen / Tastenbelegung / GTA-Pausenmenü)
function PM.OpenNative(menu)
    PM.state = 'native'
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'hide' })
    TriggerScreenblurFadeOut(0)
    ActivateFrontendMenu(joaat(menu), false, -1)

    CreateThread(function()
        -- warten bis das Menü wirklich offen ist (max. 2 s), dann bis es wieder zu ist
        local t = GetGameTimer()
        while not IsPauseMenuActive() and GetGameTimer() - t < 2000 do Wait(50) end
        while IsPauseMenuActive() do Wait(100) end
        Wait(150)
        if PM.state == 'native' then PM.OpenMenu('settings') end
    end)
end

-- ESC / P abfangen
CreateThread(function()
    while true do
        if PM.state == 'native' then
            Wait(200)
        elseif PM.state == nil and (IsPauseMenuActive() or IsNuiFocused()) then
            -- GTA-Menü oder eine fremde NUI (Handy, Inventar ...) ist offen: nicht stören
            Wait(100)
        else
            Wait(0)
            DisableControlAction(0, Config.Keys.menu, true)
            DisableControlAction(0, Config.Keys.map, true)
            if PM.state == nil then
                if GetGameTimer() - PM.lastClose > 350 then
                    if IsDisabledControlJustReleased(0, Config.Keys.menu) then
                        SetPauseMenuActive(false)
                        PM.OpenMenu('home')
                    elseif IsDisabledControlJustReleased(0, Config.Keys.map) then
                        SetPauseMenuActive(false)
                        PM.MapStart(false)
                    end
                end
            elseif PM.state == 'menu' then
                HideHudAndRadarThisFrame()
            end
        end
    end
end)

-- NUI ist bereit: Konfiguration schicken
RegisterNUICallback('ready', function(_, cb)
    local cats = {}
    for i, c in ipairs(Config.Categories) do cats[i] = { id = c.id, label = c.label, icon = c.icon } end
    local items = {}
    for _, it in ipairs(Config.Items) do
        if it.enabled ~= false then items[#items + 1] = { id = it.id, label = it.label } end
    end
    cb({
        serverName = Config.ServerName,
        accent = Config.Accent,
        units = Config.Units,
        sounds = Config.Sounds,
        items = items,
        store = Config.Store,
        help = Config.Help,
        categories = cats,
        map = Config.Map,
        minimap = Config.Minimap,
        route = { colour = Config.Route.colour },
        day = Config.Day,
        freecam = {
            speed = 100, fov = Config.FreeCam.fov, roll = 0, grid = false,
            minFov = Config.FreeCam.minFov, maxFov = Config.FreeCam.maxFov,
        },
    })
end)

RegisterNUICallback('sound', function(data, cb)
    if type(data) == 'table' and type(data.name) == 'string' then PM.Sound(data.name) end
    cb(1)
end)

RegisterNUICallback('close', function(_, cb)
    PM.CloseAll()
    cb(1)
end)

RegisterNUICallback('openMap', function(_, cb)
    cb(1)
    PM.MapStart(true)
end)

RegisterNUICallback('settings', function(data, cb)
    cb(1)
    if data.which == 'keys' then
        PM.OpenNative('FE_MENU_VERSION_LANDING_KEYMAPPING_MENU')
    else
        PM.OpenNative('FE_MENU_VERSION_LANDING_MENU')
    end
end)

RegisterNUICallback('game', function(data, cb)
    cb(1)
    if data.action == 'disconnect' then
        TriggerServerEvent('sky_pausemenu:disconnect')
    elseif data.action == 'quit' then
        ForceSocialClubUpdate() -- beendet das Spiel
    elseif data.action == 'gtapause' then
        PM.OpenNative('FE_MENU_VERSION_MP_PAUSE')
    end
end)

-- Export für andere Scripts: schöner Name + kurzer Text für einen Blip
-- exports.sky_pausemenu:SetBlipInfo(blip, 'Pillbox Hospital', 'Hier wirst du behandelt')
exports('SetBlipInfo', function(blip, name, text)
    if not blip then return end
    PM.blipInfo[blip] = { n = name, t = text }
end)

-- Export: Menü von außen öffnen / schließen
exports('Open', function(page)
    if PM.state ~= nil then return end
    if page == 'map' then PM.MapStart(false) else PM.OpenMenu(page) end
end)
exports('Close', function() if PM.state ~= nil then PM.CloseAll() end end)
exports('IsOpen', function() return PM.state ~= nil end)

AddEventHandler('onResourceStop', function(res)
    if res ~= GetCurrentResourceName() then return end
    if PM.state == 'map' then PM.MapStop() end
    if PM.state == 'freecam' then PM.FreecamStop() end
    SetNuiFocus(false, false)
    TriggerScreenblurFadeOut(0)
end)
