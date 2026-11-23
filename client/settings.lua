-- sky_pausemenu: Einstellungen
-- Lesen: echt aus GTA (GET_PROFILE_SETTING).
-- Ändern: GTAs eigenes Einstellungsmenü wird unsichtbar geöffnet und per simulierten Frontend-Tasten bedient,
-- bis die Zeile mit der Einstellungs-ID ausgewählt ist; dann wird der Wert umgestellt. GTA speichert selbst.

local S = Config.Settings

local FE = { up = 188, down = 187, left = 189, right = 190, accept = 201, back = 202 }

local function dbg(fmt, ...)
    if S.debug then print(('[sky_pausemenu:settings] ' .. fmt):format(...)) end
end

-- ---------------------------------------------------------------------------------------------
-- Werte lesen
-- ---------------------------------------------------------------------------------------------
-- Tastenname aus GTA lesen. GTA liefert z. B. "t_W" (Text) oder "b_1036" (Code, siehe client/keynames.lua);
-- mehrere Belegungen sind mit "%" getrennt -> 1. = primär, 2. = sekundär
local function partName(p)
    if not p or p == '' then return nil end
    if p:sub(1, 2) == 't_' then return p:sub(3):upper() end
    return KEY_NAMES[p] or p
end
local function keyNames(control)
    local s = GetControlInstructionalButton(0, control, true) or ''
    local parts = {}
    for part in s:gmatch('[^%%]+') do parts[#parts + 1] = part end
    return partName(parts[1]), partName(parts[2])
end

local function infoValue(kind)
    if kind == 'resolution' then
        local w, h = GetActiveScreenResolution()
        return ('%d x %d'):format(w, h)
    elseif kind == 'aspect' then
        local a = GetAspectRatio(false)
        if math.abs(a - 16 / 9) < 0.02 then return '16:9' end
        if math.abs(a - 16 / 10) < 0.02 then return '16:10' end
        if math.abs(a - 21 / 9) < 0.06 then return '21:9' end
        if math.abs(a - 4 / 3) < 0.02 then return '4:3' end
        return ('%.2f:1'):format(a)
    end
    return ''
end

local function readTabs()
    local out = {}
    for ti, tab in ipairs(S.tabs) do
        local t = { id = tab.id, label = tab.label, keys = tab.keys or nil, rows = {} }
        if tab.keys then
            t.categories = {}
            for ci, cat in ipairs(tab.categories) do
                local rows = {}
                for _, k in ipairs(cat.controls) do
                    local k1, k2 = keyNames(k.c)
                    rows[#rows + 1] = { label = k.label, k1 = k1, k2 = k2 }
                end
                t.categories[ci] = { label = cat.label, rows = rows }
            end
        else
            for ri, r in ipairs(tab.rows) do
                local row = { type = r.type, label = r.label, desc = r.desc, opts = r.opts, min = r.min, max = r.max, def = r.def }
                if r.id then row.value = GetProfileSetting(r.id) end
                if r.type == 'slider' and row.value and row.value > (row.max or 0) then
                    -- GTA speichert manche Werte in einem größeren Bereich (z. B. 0–100)
                    row.max = row.value <= 100 and 100 or row.value
                end
                if r.type == 'info' then
                    if r.value then row.text = infoValue(r.value)
                    elseif r.opts and row.value then row.text = r.opts[row.value + 1] or tostring(row.value)
                    elseif row.value then row.text = tostring(row.value) end
                end
                t.rows[ri] = row
            end
        end
        out[ti] = t
    end
    return out
end

RegisterNUICallback('settingsOpen', function(_, cb)
    cb({ tabs = readTabs(), background = S.background })
end)

-- ---------------------------------------------------------------------------------------------
-- Unsichtbares GTA-Einstellungsmenü steuern
-- ---------------------------------------------------------------------------------------------
local cache = json.decode(GetResourceKvpString('sky_pm_prefcat') or '{}') or {}
local driving = false

local function waitFrames(n) for _ = 1, n do Wait(0) end end

local function press(ctl)
    -- Taste einen Frame lang "drücken", dann loslassen
    SetControlNormal(2, ctl, 1.0)
    Wait(0)
    waitFrames(S.stepWait)
end

local function sel()
    local _, menuId, uid = GetPauseMenuSelection()
    return menuId or -1, uid or -1
end

local function openHidden()
    if IsPauseMenuActive() then return true end
    ActivateFrontendMenu(joaat('FE_MENU_VERSION_LANDING_MENU'), false, -1)
    local t = GetGameTimer()
    while not IsPauseMenuActive() and GetGameTimer() - t < 3000 do Wait(0) end
    while not IsFrontendReadyForControl() and GetGameTimer() - t < 5000 do Wait(0) end
    waitFrames(10)
    local m, u = sel()
    dbg('Menü offen: aktiv=%s bereit=%s Auswahl=%d/%d', tostring(IsPauseMenuActive()), tostring(IsFrontendReadyForControl()), m, u)
    return IsPauseMenuActive()
end

local function closeHidden()
    SetFrontendActive(false)
    local t = GetGameTimer()
    while IsPauseMenuActive() and GetGameTimer() - t < 2000 do Wait(0) end
    waitFrames(5)
end

-- in der aktuellen Spalte nach unten gehen, bis die Zeile mit der ID ausgewählt ist
local function seekRow(prefId)
    local seen = {}
    for _ = 1, 70 do
        local m, u = sel()
        dbg('  Zeile: Menü %d, Eintrag %d', m, u)
        if u == prefId then return true end
        local key = m .. ':' .. u
        if seen[key] then return false end
        seen[key] = true
        press(FE.down)
    end
    return false
end

-- Kategorie finden (gemerkt in KVP), die die Einstellung enthält
local function findPref(prefId)
    press(FE.accept) -- vom Tab in die Kategorien-Liste
    local known = cache[tostring(prefId)]
    if known then
        for _ = 1, known do press(FE.down) end
        press(FE.accept)
        if seekRow(prefId) then return true end
        press(FE.back)
        for _ = 1, known do press(FE.up) end
    end
    local seenCats = {}
    for ci = 0, 25 do
        if ci > 0 then press(FE.down) end
        local m, u = sel()
        dbg('Kategorie %d: Menü %d, Eintrag %d', ci, m, u)
        local key = m .. ':' .. u
        if seenCats[key] then break end
        seenCats[key] = true
        press(FE.accept)
        if seekRow(prefId) then
            cache[tostring(prefId)] = ci
            SetResourceKvp('sky_pm_prefcat', json.encode(cache))
            return true
        end
        press(FE.back)
    end
    return false
end

local function applySetting(prefId, target)
    local before = GetProfileSetting(prefId)
    if before == target then return true, before end
    if not openHidden() then return false, before end

    local ok = findPref(prefId)
    if ok then
        -- Schrittweite pro Tastendruck messen (z. B. 1 oder 5), dann gezielt drücken
        local cur = GetProfileSetting(prefId)
        local tries = 0
        while cur ~= target and tries < 120 do
            local dir = target > cur and FE.right or FE.left
            press(dir)
            tries = tries + 1
            local now = GetProfileSetting(prefId)
            dbg('Wert %d -> %d (Ziel %d)', cur, now, target)
            if now == cur then
                -- GTA übernimmt den Wert evtl. erst beim Schließen: restliche Schritte zählen
                for _ = 2, math.abs(target - cur) do press(dir) end
                break
            end
            if (target - now) * (target - cur) < 0 then
                -- übers Ziel hinaus (größere Schritte): einen zurück, wenn das näher ist
                if math.abs(target - now) > math.abs(target - cur) then press(dir == FE.right and FE.left or FE.right) end
                break
            end
            cur = now
        end
    else
        dbg('Einstellung %d nicht im GTA-Menü gefunden', prefId)
    end
    closeHidden()
    Wait(100)
    local after = GetProfileSetting(prefId)
    return after == target, after
end

-- Warteschlange (eine Änderung nach der anderen)
local queue = {}
local function runQueue()
    if driving then return end
    driving = true
    CreateThread(function()
        -- GTA-Menü unsichtbar halten
        CreateThread(function()
            while driving do
                SuppressFrontendRenderingThisFrame()
                Wait(0)
            end
        end)
        while #queue > 0 do
            local job = table.remove(queue, 1)
            local ok, value = applySetting(job.id, job.value)
            dbg('Ergebnis %d: %s (Wert %s)', job.id, tostring(ok), tostring(value))
            SendNUIMessage({ action = 'settingsValue', tab = job.tab, row = job.row, value = value, ok = ok })
        end
        driving = false
    end)
end

local function rowDef(tab, row)
    local t = S.tabs[tab]
    return t and t.rows and t.rows[row]
end

RegisterNUICallback('settingsSet', function(d, cb)
    cb(1)
    local tab, row, value = tonumber(d.tab), tonumber(d.row), tonumber(d.value)
    local r = tab and row and rowDef(tab, row)
    if not r or not r.id or not value or r.type == 'info' then return end
    -- alten Auftrag für dieselbe Zeile ersetzen
    for i = #queue, 1, -1 do
        if queue[i].id == r.id then table.remove(queue, i) end
    end
    queue[#queue + 1] = { id = r.id, value = math.floor(value), tab = tab, row = row }
    runQueue()
end)

RegisterNUICallback('settingsRestore', function(d, cb)
    cb(1)
    local tab = tonumber(d.tab)
    local t = tab and S.tabs[tab]
    if not t or not t.rows then return end
    for ri, r in ipairs(t.rows) do
        if r.id and r.def ~= nil and GetProfileSetting(r.id) ~= r.def then
            queue[#queue + 1] = { id = r.id, value = r.def, tab = tab, row = ri }
        end
    end
    runQueue()
end)

RegisterNUICallback('settingsNative', function(d, cb)
    cb(1)
    local t = S.tabs[tonumber(d.tab) or 0]
    if t and t.keys then
        -- GTA-Tastenbelegung (Tastatur & Maus) oder FiveM-Tastenbelegung der Scripts
        PM.OpenNative(d.fivem and 'FE_MENU_VERSION_LANDING_KEYMAPPING_MENU' or 'FE_MENU_VERSION_LANDING_MENU')
        return
    end
    local r = rowDef(tonumber(d.tab), tonumber(d.row))
    if r and r.menu then PM.OpenNative(r.menu) end
end)

-- Hilfe beim Einrichten: /pm_settingsreset löscht die gemerkten Menü-Positionen
RegisterCommand('pm_settingsreset', function()
    cache = {}
    DeleteResourceKvp('sky_pm_prefcat')
    print('[sky_pausemenu] Gemerkte Menü-Positionen gelöscht.')
end, false)
