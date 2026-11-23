Config = {}

-- Allgemein
Config.ServerName   = 'MEIN SERVER'     -- oben links im Menü
Config.Accent       = '#ee7bb2'         -- Akzentfarbe (Auswahl, Infokarte, Icons)
Config.Units        = 'km'              -- 'km' oder 'mi'
Config.Blur         = true              -- Hintergrund unscharf, solange das Menü offen ist
Config.Sounds       = true              -- GTA-eigene Menü-Sounds

-- Tasten (Control-IDs: https://docs.fivem.net/docs/game-references/controls/)
Config.Keys = {
    menu = 200,     -- ESC  -> Pausenmenü
    map  = 199,     -- P    -> direkt die 3D-Karte
}

-- Menüpunkte links (Reihenfolge = Anzeige). enabled = false blendet einen Punkt aus.
Config.Items = {
    { id = 'map',      label = 'Karte',          enabled = true },
    { id = 'game',     label = 'Spiel',          enabled = true },
    { id = 'store',    label = 'Shop',           enabled = true },
    { id = 'help',     label = 'Hilfe',          enabled = true },
    { id = 'camera',   label = 'Freie Kamera',   enabled = true },
    { id = 'settings', label = 'Einstellungen',  enabled = true },
}

-- Shop-Seite (NUI kann keinen externen Browser öffnen, daher Link + Text zum Abschreiben)
Config.Store = {
    title = 'SHOP',
    text  = 'Unterstütze den Server und hol dir exklusive Fahrzeuge, Kleidung und mehr.',
    link  = 'shop.meinserver.de',
    packages = {
        { name = 'VIP Bronze', price = '4,99 €', text = 'Eigene Garage, 2 Fahrzeugslots extra' },
        { name = 'VIP Silber', price = '9,99 €', text = 'Alles aus Bronze + Wunschkennzeichen' },
        { name = 'VIP Gold',   price = '19,99 €', text = 'Alles aus Silber + Prioritäts-Warteschlange' },
    },
}

-- Hilfe-Seite (Fragen/Antworten)
Config.Help = {
    { q = 'Wie setze ich einen Wegpunkt?', a = 'Öffne die Karte (P), wähle einen Ort in der Liste oder doppelklicke auf die Karte und drücke ENTER.' },
    { q = 'Wie bewege ich die Karte?', a = 'Linke Maustaste ziehen = verschieben, rechte Maustaste ziehen = drehen, Mausrad = zoomen, V = 2D/3D, R = zentrieren.' },
    { q = 'Wo finde ich die Regeln?', a = 'Auf unserem Discord im Kanal #regeln.' },
    { q = 'Wie erreiche ich den Support?', a = 'Über das Ticket-System auf unserem Discord.' },
}

-- 3D-Pausenkarte (gerendert aus html/map-data.js)
Config.Map = {
    zoom      = 700,     -- Abstand der Kamera beim Öffnen (m)
    minZoom   = 160,     -- am nächsten
    maxZoom   = 16000,   -- am weitesten (ganze Karte)
    zoomStep  = 1.2,     -- Faktor pro Mausrad-Raste
    tiltNear  = 48,      -- Neigung nah dran (Grad über dem Horizont, 90 = senkrecht)
    tiltFar   = 90,      -- Neigung ganz weit weg
    fov       = 40,
    labels    = true,    -- Stadtteil-Namen auf der Karte
}

-- 3D-Minimap (ersetzt die GTA-Minimap)
Config.Minimap = {
    enabled       = true,
    hideNative    = true,   -- GTA-Minimap ausblenden (Achtung: GTA-Lebens-/Westenbalken sind Teil davon)
    onlyInVehicle = false,
    fps           = 30,     -- maximale Bildrate (weniger = weniger Last)
    tilt          = 55,     -- Neigung (Grad über dem Horizont, 90 = von oben)
    zoom          = 380,    -- Abstand zu Fuß (m)
    speedZoom     = 6,      -- zusätzlicher Abstand pro m/s Fahrzeug-Tempo
    maxZoom       = 900,
    -- Position und Größe (vh = % der Bildschirmhöhe)
    left = 2.2, bottom = 3.6, width = 30, height = 18.5,
}

-- GPS-Linie zum Wegpunkt (folgt der echten GTA-Route)
Config.Route = {
    colour    = '#5fe3c8',
    step      = 15.0,   -- Abstand der Routenpunkte (m)
    maxPoints = 600,
}

-- Tag-/Nacht-Look der Karten nach Spieluhr (Stunden)
Config.Day = { dawn = 6, dusk = 20, fade = 1.5 }

-- Blip-Kategorien (linke Icon-Leiste). Jeder Blip kommt in die erste Kategorie, die sein Sprite enthält.
-- Blips ohne Kategorie landen bei "Persönlich". icon = Name eines eingebauten Icons (siehe html/app.js ICONS)
Config.Categories = {
    { id = 'personal', label = 'PERSÖNLICH',     icon = 'nav' },
    { id = 'bank',     label = 'BANKEN & ATM',   icon = 'money',   sprites = { 108, 207, 500, 272, 277 } },
    { id = 'markets',  label = 'GESCHÄFTE',      icon = 'cart',    sprites = { 52, 59, 361, 605 } },
    { id = 'garages',  label = 'GARAGEN',        icon = 'car',     sprites = { 50, 225, 357, 369, 524, 856, 872, 290, 326 } },
    { id = 'repair',   label = 'WERKSTÄTTEN',    icon = 'wrench',  sprites = { 72, 446, 402, 643 } },
    { id = 'weapons',  label = 'WAFFENLÄDEN',    icon = 'gun',     sprites = { 110, 313, 844 } },
    { id = 'clothes',  label = 'KLEIDUNG',       icon = 'shirt',   sprites = { 71, 73, 75, 366 } },
    { id = 'food',     label = 'ESSEN & BARS',   icon = 'food',    sprites = { 93, 121, 827, 889, 106 } },
    { id = 'service',  label = 'DIENSTE',        icon = 'shield',  sprites = { 60, 61, 436, 137, 526 } },
}

-- Blip-Namen: standardmäßig der GTA-eigene Name des Sprites (z. B. 60 = "Polizeirevier", in der Spielsprache).
-- Hinweis: Den Namen, den ein Script mit BeginTextCommandSetBlipName setzt, kann GTA nicht zurückgeben (keine Native).
-- Eigener Name + Text pro Blip aus einem Script:  exports.sky_pausemenu:SetBlipInfo(blip, 'Name', 'kurzer Text')
-- Hier kannst du GTA-Namen pro Sprite überschreiben, z. B.  [60] = 'LSPD Mission Row',
Config.BlipNames = {
}

-- Diese Sprites nie in der Liste/als Icon zeigen (6 = Spieler-Pfeil, 8 = Wegpunkt, 9 = Radius-Kreis, 162 = Spieler)
Config.HiddenSprites = { [6] = true, [8] = true, [9] = true, [162] = true }

-- Freie Kamera
Config.FreeCam = {
    speed   = 8.0,      -- m/s bei 100 %
    radius  = 60.0,     -- wie weit sie sich vom Spieler entfernen darf (m), 0 = unbegrenzt
    fov     = 50.0,
    minFov  = 10.0,
    maxFov  = 100.0,
    look    = 6.0,      -- Maus-Empfindlichkeit
}
