-- Einstellungsseite: Tabs und Zeilen (Aufbau wie GTA)
-- id   = GTA-Profil-Einstellung (GET_PROFILE_SETTING): https://docs.fivem.net/docs/game-references/profile-settings/
-- type = 'list' (opts = Namen der Werte 0,1,2 …), 'toggle' (0/1), 'slider' (min..max), 'info' (nur Anzeige), 'native' (öffnet GTA-Menü)
-- def  = Standardwert für "Standardwerte wiederherstellen"
-- Werte werden live aus GTA gelesen. Änderungen macht das Script in GTAs eigenem (unsichtbaren) Einstellungsmenü,
-- GTA speichert sie selbst. Liegt ein gelesener Wert über "max", wird der Bereich automatisch erweitert.

Config.Settings = {
    debug = false,          -- true = jeder Schritt der Menüsteuerung in der F8-Konsole
    stepWait = 2,           -- Frames zwischen zwei simulierten Tastendrücken (höher = langsamer, sicherer)
    background = 'img/settings-bg.jpg', -- optionales Hintergrundbild (html/img/...), sonst Farbverlauf mit Palmen

    tabs = {
        {
            id = 'display', label = 'ANZEIGE',
            rows = {
                { id = 204, type = 'list', label = 'Radar', opts = { 'Aus', 'An', 'Nur Blips' }, def = 1, desc = 'Zeigt die Minimap an oder blendet sie aus.' },
                { id = 205, type = 'toggle', label = 'HUD', def = 1, desc = 'Blendet das HUD ein oder aus.' },
                { id = 221, type = 'toggle', label = 'Erweitertes Radar', def = 0, desc = 'Zeigt dauerhaft die große Minimap.' },
                { id = 412, type = 'list', label = 'Waffen-Zielhilfe', opts = { 'Komplex', 'Einfach' }, def = 0, desc = 'Art des Fadenkreuzes beim Zielen.' },
                { id = 415, type = 'slider', label = 'Größe einfaches Fadenkreuz', min = 0, max = 10, def = 0, desc = 'Größe des einfachen Fadenkreuzes.' },
                { id = 207, type = 'toggle', label = 'GPS-Route', def = 1, desc = 'Zeigt die GPS-Route zum Wegpunkt an.' },
                { id = 213, type = 'slider', label = 'Helligkeit', min = 0, max = 30, def = 15, desc = 'Helligkeit des Bildes.' },
                { id = 212, type = 'slider', label = 'Größe des sicheren Bereichs', min = 0, max = 10, def = 10, desc = 'Abstand des HUD zum Bildschirmrand.' },
                { id = 226, type = 'toggle', label = 'Bildschirm-Effekte bei Kills', def = 1, desc = 'Bildschirmeffekt, wenn du jemanden ausschaltest.' },
                { id = 203, type = 'toggle', label = 'Untertitel', def = 1, desc = 'Untertitel für Dialoge.' },
                { id = 222, type = 'list', label = 'Spieler-Anzeige über Köpfen', opts = { 'Aus', 'Name', 'Name + Rang' }, def = 1, desc = 'Was über anderen Spielern angezeigt wird.' },
                { id = 227, type = 'list', label = 'Maßeinheiten', opts = { 'Imperial', 'Metrisch' }, def = 1, desc = 'Meilen/Fuß oder Kilometer/Meter.' },
                { id = 206, type = 'info', label = 'Sprache', opts = { 'Englisch', 'Französisch', 'Deutsch', 'Italienisch', 'Spanisch', 'Portugiesisch', 'Polnisch', 'Russisch', 'Koreanisch', 'Chinesisch (trad.)', 'Japanisch', 'Spanisch (MX)', 'Chinesisch (vereinf.)' }, desc = 'Spielsprache (wird im Launcher eingestellt).' },
            },
        },
        {
            id = 'graphics', label = 'GRAFIK',
            rows = {
                { type = 'info', label = 'Auflösung', value = 'resolution', desc = 'Aktuelle Bildschirmauflösung (aus GTA gelesen).' },
                { type = 'info', label = 'Seitenverhältnis', value = 'aspect', desc = 'Aktuelles Seitenverhältnis (aus GTA gelesen).' },
                { id = 710, type = 'toggle', label = 'Empfohlene Grenzen ignorieren', def = 0, desc = 'Erlaubt Grafik-Einstellungen über dem empfohlenen Videospeicher.' },
                { type = 'native', label = 'Alle Grafik-Optionen', menu = 'FE_MENU_VERSION_LANDING_MENU', desc = 'Texturen, Schatten, Antialiasing, Reflexionen usw. – GTA übernimmt diese erst nach einer Bestätigung im eigenen Grafikmenü, das sich hier öffnet.' },
            },
        },
        {
            id = 'audio', label = 'AUDIO',
            rows = {
                { id = 300, type = 'slider', label = 'Effekt-Lautstärke', min = 0, max = 10, def = 10, desc = 'Lautstärke von Effekten.' },
                { id = 306, type = 'slider', label = 'Musik-Lautstärke', min = 0, max = 10, def = 8, desc = 'Lautstärke von Musik und Radio.' },
                { id = 308, type = 'slider', label = 'Dialog-Verstärkung', min = 0, max = 10, def = 5, desc = 'Hebt Dialoge gegenüber anderen Geräuschen hervor.' },
                { id = 305, type = 'list', label = 'Audio-Ausgabe', opts = { 'Stereo', 'Kopfhörer', 'Surround' }, def = 0, desc = 'Art der Lautsprecher.' },
                { id = 316, type = 'list', label = 'Eigenes Radio', opts = { 'Radio', 'Zufällig', 'Talk' }, def = 0, desc = 'Wie das eigene Radio abgespielt wird.' },
                { id = 317, type = 'toggle', label = 'Automatisch nach Musik suchen', def = 1, desc = 'Sucht automatisch nach neuer Musik.' },
                { id = 318, type = 'toggle', label = 'Stumm bei Fokusverlust', def = 1, desc = 'Ton aus, wenn das Spiel im Hintergrund ist.' },
            },
        },
        {
            id = 'voice', label = 'SPRACHCHAT',
            rows = {
                { id = 720, type = 'toggle', label = 'Sprachchat aktiviert', def = 1, desc = 'GTA-Sprachchat ein/aus.' },
                { id = 721, type = 'info', label = 'Ausgabegerät', desc = 'Ausgabegerät für den Sprachchat (Nummer des Geräts in GTA).' },
                { id = 722, type = 'slider', label = 'Sprachchat-Lautstärke', min = 0, max = 10, def = 10, desc = 'Lautstärke der anderen Spieler.' },
                { id = 723, type = 'toggle', label = 'Mikrofon aktiviert', def = 1, desc = 'Mikrofon ein/aus.' },
                { id = 724, type = 'info', label = 'Eingabegerät', desc = 'Mikrofon für den Sprachchat (Nummer des Geräts in GTA).' },
                { id = 725, type = 'list', label = 'Sprachchat-Modus', opts = { 'Push-to-Talk', 'Offen' }, def = 0, desc = 'Sprechen per Taste oder dauerhaft.' },
                { id = 726, type = 'slider', label = 'Mikrofon-Lautstärke', min = 0, max = 10, def = 10, desc = 'Lautstärke deines Mikrofons.' },
                { id = 727, type = 'slider', label = 'Mikrofon-Empfindlichkeit', min = 0, max = 10, def = 5, desc = 'Ab welcher Lautstärke dein Mikrofon sendet.' },
                { id = 728, type = 'slider', label = 'Effekte während Sprachchat', min = 0, max = 10, def = 10, desc = 'Effekt-Lautstärke während jemand spricht.' },
                { id = 729, type = 'slider', label = 'Musik während Sprachchat', min = 0, max = 10, def = 10, desc = 'Musik-Lautstärke während jemand spricht.' },
            },
        },
        {
            id = 'controller', label = 'CONTROLLER',
            rows = {
                { id = 0, type = 'list', label = 'Zielmodus', opts = { 'Assistiert – komplett', 'Assistiert – teilweise', 'Frei – assistiert', 'Frei' }, def = 0, desc = 'Wie stark das Zielen unterstützt wird.' },
                { id = 1, type = 'toggle', label = 'Umsehen invertieren', def = 0, desc = 'Vertikale Kamera umkehren.' },
                { id = 2, type = 'toggle', label = 'Vibration', def = 1, desc = 'Controller-Vibration.' },
                { id = 12, type = 'list', label = 'Steuerung 3rd Person', opts = { 'Standard', 'Alternativ' }, def = 0, desc = 'Belegung der Sticks in der 3rd Person.' },
                { id = 13, type = 'slider', label = 'Ziel-Empfindlichkeit 3rd Person', min = 0, max = 14, def = 7, desc = 'Empfindlichkeit beim Zielen.' },
                { id = 14, type = 'slider', label = 'Umsehen-Empfindlichkeit 3rd Person', min = 0, max = 14, def = 7, desc = 'Empfindlichkeit beim Umsehen.' },
                { id = 240, type = 'slider', label = 'Totzone 3rd Person', min = 0, max = 14, def = 7, desc = 'Totzone der Sticks beim Zielen/Umsehen.' },
                { id = 241, type = 'slider', label = 'Beschleunigung 3rd Person', min = 0, max = 14, def = 7, desc = 'Beschleunigung beim Zielen/Umsehen.' },
                { id = 20, type = 'list', label = 'Steuerung 1st Person', opts = { 'Standard', 'Alternativ' }, def = 0, desc = 'Belegung der Sticks in der Ego-Perspektive.' },
                { id = 233, type = 'slider', label = 'Ziel-Empfindlichkeit 1st Person', min = 0, max = 14, def = 7, desc = 'Empfindlichkeit beim Zielen.' },
                { id = 232, type = 'slider', label = 'Umsehen-Empfindlichkeit 1st Person', min = 0, max = 14, def = 7, desc = 'Empfindlichkeit beim Umsehen.' },
                { id = 238, type = 'slider', label = 'Totzone 1st Person', min = 0, max = 14, def = 7, desc = 'Totzone der Sticks beim Zielen/Umsehen.' },
                { id = 239, type = 'slider', label = 'Beschleunigung 1st Person', min = 0, max = 14, def = 7, desc = 'Beschleunigung beim Zielen/Umsehen.' },
                { id = 17, type = 'toggle', label = 'Bewegen beim Zoomen', def = 1, desc = 'Bewegen erlaubt, während gezoomt wird.' },
                { id = 19, type = 'list', label = 'Sprint-Modus', opts = { 'Tippen', 'Halten' }, def = 0, desc = 'Sprinten durch Tippen oder Halten.' },
                { id = 223, type = 'toggle', label = 'Handbremse mit Ducken tauschen', def = 0, desc = 'Tauscht Handbremse und Ducken/Hydraulik.' },
                { id = 225, type = 'list', label = 'Drive-by-Steuerung', opts = { 'Standard', 'Alternativ' }, def = 0, desc = 'Steuerung beim Schießen aus dem Fahrzeug.' },
            },
        },
        {
            id = 'keyboard', label = 'TASTATUR & MAUS',
            rows = {
                { id = 750, type = 'list', label = 'Maus-Eingabemethode', opts = { 'Raw Input', 'DirectInput', 'Windows' }, def = 0, desc = 'Wie GTA die Maus liest.' },
                { id = 15, type = 'toggle', label = 'Maus invertieren', def = 0, desc = 'Vertikale Mausbewegung umkehren.' },
                { id = 21, type = 'toggle', label = 'Maus beim Fliegen invertieren', def = 0, desc = 'Vertikale Maus beim Fliegen umkehren.' },
                { id = 22, type = 'toggle', label = 'Maus im U-Boot invertieren', def = 0, desc = 'Vertikale Maus im U-Boot umkehren.' },
                { id = 26, type = 'list', label = 'Flugsteuerung mit Maus', opts = { 'Gieren', 'Rollen' }, def = 0, desc = 'Was die Maus beim Fliegen steuert.' },
                { id = 752, type = 'toggle', label = 'Fahren mit Maus', def = 0, desc = 'Fahrzeug mit der Maus lenken.' },
                { id = 753, type = 'toggle', label = 'Fliegen mit Maus', def = 0, desc = 'Flugzeuge mit der Maus steuern.' },
                { id = 751, type = 'toggle', label = 'U-Boot mit Maus', def = 0, desc = 'U-Boot mit der Maus steuern.' },
                { id = 23, type = 'toggle', label = 'Maus im Auto zentrieren', def = 0, desc = 'Kamera im Auto automatisch zentrieren.' },
                { id = 24, type = 'toggle', label = 'Maus auf Motorrad zentrieren', def = 0, desc = 'Kamera auf dem Motorrad automatisch zentrieren.' },
                { id = 25, type = 'toggle', label = 'Maus im Flugzeug zentrieren', def = 0, desc = 'Kamera im Flugzeug automatisch zentrieren.' },
                { id = 754, type = 'slider', label = 'Maus-Empfindlichkeit', min = 0, max = 100, def = 50, desc = 'Empfindlichkeit beim Umsehen mit der Maus.' },
                { id = 755, type = 'slider', label = 'Maus-Empfindlichkeit Fahren', min = 0, max = 100, def = 50, desc = 'Empfindlichkeit beim Fahren mit der Maus.' },
                { id = 756, type = 'slider', label = 'Maus-Empfindlichkeit Flugzeug', min = 0, max = 100, def = 50, desc = 'Empfindlichkeit im Flugzeug.' },
                { id = 757, type = 'slider', label = 'Maus-Empfindlichkeit Heli', min = 0, max = 100, def = 50, desc = 'Empfindlichkeit im Hubschrauber.' },
                { id = 760, type = 'slider', label = 'Maus-Empfindlichkeit U-Boot', min = 0, max = 100, def = 50, desc = 'Empfindlichkeit im U-Boot.' },
                { id = 761, type = 'slider', label = 'Maus-Glättung', min = 0, max = 100, def = 0, desc = 'Glättet die Mausbewegung.' },
                { id = 229, type = 'list', label = 'Zielart 1st Person', opts = { 'Standard', 'Alternativ' }, def = 0, desc = 'Zielverhalten in der Ego-Perspektive.' },
                { id = 758, type = 'list', label = 'Zielen', opts = { 'Halten', 'Umschalten' }, def = 0, desc = 'Zieltaste halten oder umschalten.' },
                { id = 762, type = 'toggle', label = 'Feines Zielen', def = 0, desc = 'Langsameres Zielen mit gehaltener Taste.' },
            },
        },
        {
            id = 'camera', label = 'KAMERA',
            rows = {
                { id = 230, type = 'toggle', label = 'Unabhängige Kamera-Modi', def = 0, desc = 'Eigene Kameraperspektive pro Fortbewegungsart.' },
                { id = 220, type = 'list', label = 'Fahrzeugkamera-Höhe', opts = { 'Niedrig', 'Hoch' }, def = 0, desc = 'Höhe der Kamera hinter dem Fahrzeug.' },
                { id = 242, type = 'toggle', label = '1st Person Kamera automatisch ausrichten', def = 1, desc = 'Richtet die Ego-Kamera automatisch gerade aus.' },
                { id = 231, type = 'slider', label = 'Sichtfeld 1st Person zu Fuß', min = 0, max = 10, def = 5, desc = 'Sichtfeld in der Ego-Perspektive.' },
                { id = 234, type = 'toggle', label = '1st Person Ragdoll', def = 0, desc = 'Ego-Perspektive bleibt beim Hinfallen.' },
                { id = 235, type = 'toggle', label = '1st Person Kampfrolle', def = 0, desc = 'Ego-Perspektive bei der Kampfrolle.' },
                { id = 236, type = 'toggle', label = '1st Person Kopfwackeln', def = 1, desc = 'Kamera wackelt beim Laufen.' },
                { id = 237, type = 'toggle', label = '1st Person: 3rd Person in Deckung', def = 1, desc = 'Wechselt in Deckung in die 3rd Person.' },
                { id = 243, type = 'toggle', label = '1st Person Motorhaube', def = 0, desc = 'Ego-Kamera auf der Motorhaube.' },
                { id = 244, type = 'toggle', label = '1st Person Fahrzeug automatisch zentrieren', def = 1, desc = 'Zentriert die Ego-Kamera im Fahrzeug.' },
                { id = 245, type = 'toggle', label = '1st Person Drive-by relativ zum Fahrzeug', def = 0, desc = 'Drive-by-Kamera richtet sich am Fahrzeug aus.' },
            },
        },
        {
            id = 'replay', label = 'REPLAY',
            rows = {
                { type = 'native', label = 'Rockstar Editor / Replay', menu = 'FE_MENU_VERSION_LANDING_MENU', desc = 'Speicherplatz, automatisches Speichern, Upload-Status und Editor-Hinweise verwaltet GTA im eigenen Replay-Menü, das sich hier öffnet.' },
            },
        },
        {
            id = 'keys', label = 'TASTENBELEGUNG', keys = true,
            -- Kategorien wie in GTA. c = GTA-Control-ID (https://docs.fivem.net/docs/game-references/controls/)
            -- Die Tasten (primär + sekundär) werden direkt aus GTA gelesen.
            categories = {
                { label = 'Allgemein', controls = {
                    { c = 199, label = 'Pause' }, { c = 20, label = 'Radar-Zoom / Multiplayer-Info' }, { c = 0, label = 'Kamera wechseln' },
                    { c = 28, label = 'Spezialfähigkeit' }, { c = 19, label = 'Charakterauswahl' }, { c = 166, label = 'Zu Michael wechseln' },
                    { c = 167, label = 'Zu Franklin wechseln' }, { c = 168, label = 'Zu Trevor wechseln' }, { c = 169, label = 'Zum Multiplayer-Charakter' },
                    { c = 26, label = 'Zurückschauen' }, { c = 27, label = 'Handy' }, { c = 243, label = 'Cheat-Code eingeben' },
                } },
                { label = 'Bewegung', controls = {
                    { c = 32, label = 'Vorwärts' }, { c = 33, label = 'Rückwärts' }, { c = 34, label = 'Links' }, { c = 35, label = 'Rechts' },
                    { c = 21, label = 'Sprinten' }, { c = 22, label = 'Springen' }, { c = 36, label = 'Ducken / Schleichen' },
                    { c = 23, label = 'Fahrzeug betreten' }, { c = 51, label = 'Kontextaktion' }, { c = 38, label = 'Aufheben' },
                } },
                { label = 'Kampf', controls = {
                    { c = 25, label = 'Zielen / Anvisieren' }, { c = 44, label = 'Deckung' }, { c = 58, label = 'Granate werfen / Haftbombe zünden' },
                    { c = 140, label = 'Leichter Nahkampfangriff' }, { c = 141, label = 'Schwerer Nahkampfangriff' }, { c = 142, label = 'Alternativer Nahkampfangriff' },
                    { c = 143, label = 'Ausweichen' }, { c = 24, label = 'Angreifen' }, { c = 45, label = 'Nachladen' }, { c = 47, label = 'Waffe ablegen / Zünden' },
                } },
                { label = 'Waffenauswahl', controls = {
                    { c = 37, label = 'Waffenrad' }, { c = 157, label = 'Unbewaffnet' }, { c = 158, label = 'Nahkampf' }, { c = 160, label = 'Schrotflinte' },
                    { c = 164, label = 'Schwere Waffe' }, { c = 165, label = 'Spezialwaffe' }, { c = 159, label = 'Pistole' }, { c = 161, label = 'MP' },
                    { c = 162, label = 'Sturmgewehr' }, { c = 163, label = 'Scharfschützengewehr' }, { c = 16, label = 'Nächste Waffe' }, { c = 17, label = 'Vorherige Waffe' },
                } },
                { label = 'Fahrzeug', controls = {
                    { c = 71, label = 'Gas geben' }, { c = 72, label = 'Bremsen / Rückwärts' }, { c = 63, label = 'Links lenken' }, { c = 64, label = 'Rechts lenken' },
                    { c = 76, label = 'Handbremse' }, { c = 75, label = 'Fahrzeug verlassen' }, { c = 86, label = 'Hupe' }, { c = 74, label = 'Scheinwerfer' },
                    { c = 80, label = 'Kinokamera' }, { c = 79, label = 'Zurückschauen' }, { c = 85, label = 'Radio-Rad' }, { c = 81, label = 'Nächster Sender' },
                    { c = 82, label = 'Vorheriger Sender' }, { c = 68, label = 'Zielen' }, { c = 69, label = 'Angreifen' }, { c = 73, label = 'Ducken' },
                } },
                { label = 'Fahrrad', controls = {
                    { c = 136, label = 'Treten' }, { c = 137, label = 'Sprinten' }, { c = 138, label = 'Vorderbremse' }, { c = 139, label = 'Hinterbremse' },
                } },
                { label = 'Flugzeug', controls = {
                    { c = 87, label = 'Schub erhöhen' }, { c = 88, label = 'Schub verringern' }, { c = 89, label = 'Gieren links' }, { c = 90, label = 'Gieren rechts' },
                    { c = 108, label = 'Rollen links' }, { c = 109, label = 'Rollen rechts' }, { c = 111, label = 'Nase hoch' }, { c = 112, label = 'Nase runter' },
                    { c = 113, label = 'Fahrwerk' }, { c = 114, label = 'Angreifen' },
                } },
                { label = 'Hubschrauber', controls = {
                    { c = 87, label = 'Steigen' }, { c = 88, label = 'Sinken' }, { c = 89, label = 'Gieren links' }, { c = 90, label = 'Gieren rechts' },
                    { c = 108, label = 'Rollen links' }, { c = 109, label = 'Rollen rechts' }, { c = 111, label = 'Nase hoch' }, { c = 112, label = 'Nase runter' },
                } },
                { label = 'U-Boot', controls = {
                    { c = 124, label = 'Links drehen' }, { c = 125, label = 'Rechts drehen' }, { c = 127, label = 'Nase hoch' }, { c = 128, label = 'Nase runter' },
                    { c = 129, label = 'Schub erhöhen' }, { c = 130, label = 'Schub verringern' }, { c = 131, label = 'Aufsteigen' }, { c = 132, label = 'Abtauchen' },
                } },
                { label = 'Fallschirm', controls = {
                    { c = 144, label = 'Fallschirm öffnen' }, { c = 145, label = 'Fallschirm abwerfen' }, { c = 147, label = 'Links' }, { c = 148, label = 'Rechts' },
                    { c = 150, label = 'Nach vorne' }, { c = 151, label = 'Nach hinten' }, { c = 152, label = 'Bremse links' }, { c = 153, label = 'Bremse rechts' },
                    { c = 154, label = 'Rauch' }, { c = 155, label = 'Präzisionslandung' },
                } },
                { label = 'Handy', controls = {
                    { c = 172, label = 'Hoch' }, { c = 173, label = 'Runter' }, { c = 174, label = 'Links' }, { c = 175, label = 'Rechts' },
                    { c = 176, label = 'Auswählen' }, { c = 177, label = 'Abbrechen' }, { c = 178, label = 'Option' }, { c = 179, label = 'Zusatzoption' },
                } },
                { label = 'Multiplayer', controls = {
                    { c = 244, label = 'Interaktionsmenü' }, { c = 245, label = 'Chat (alle)' }, { c = 246, label = 'Chat (Team)' }, { c = 249, label = 'Push-to-Talk' },
                } },
                { label = 'Replay', controls = {
                    { c = 288, label = 'Aufnahme starten/stoppen' }, { c = 289, label = 'Aufnahme starten/stoppen (2)' }, { c = 170, label = 'Clip speichern' },
                } },
            },
        },
    },
}
