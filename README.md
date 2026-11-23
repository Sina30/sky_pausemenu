# sky_pausemenu

Ein komplett neues Pausenmenü für FiveM im Stil von GTA VI: eigene **3D-Karte**, **3D-Minimap**, echte **GTA-Einstellungen**, **freie Kamera** und eine Blip-Liste mit Kategorien.

- **Standalone:** läuft mit ESX, QBCore, Qbox oder ganz ohne Framework
- **Keine Datenbank**, keine Items, keine Abhängigkeiten
- **Keine Blip-Einrichtung:** jeder Blip, den irgendein Script erstellt, erscheint automatisch auf der Karte

---

## Inhalt

- [Funktionen](#funktionen)
- [Installation](#installation)
- [Tasten](#tasten)
- [Konfiguration](#konfiguration)
- [Exports](#exports)
- [Wie es funktioniert](#wie-es-funktioniert)
- [Bekannte Grenzen](#bekannte-grenzen)
- [Fehlersuche](#fehlersuche)
- [Credits](#credits)

---

## Funktionen

### Pausenmenü (ESC)
- Menüpunkte **Karte, Spiel, Shop, Hilfe, Freie Kamera, Einstellungen** (einzeln abschaltbar)
- Spielername, Server-ID, Spieluhr und aktuelles Gebiet oben rechts
- **Spiel:** Verbindung trennen, Spiel beenden (mit Rückfrage) und das originale GTA-Pausenmenü
- **Shop** und **Hilfe** mit eigenen Texten aus der Config
- GTA-eigene Menü-Sounds, Bedienung mit Tastatur oder Maus

### 3D-Pausenkarte (P)
- Gerendert mit three.js: Gelände mit Höhen, Wasser, Straßen, Highways, Brücken mit echter Höhe und Gebäude mit echter Dachhöhe
- Stufenlos zoombar bis zur ganzen Karte; die Neigung geht beim Rauszoomen in die Draufsicht über
- **2D/3D-Umschalter**, Drehen, Zentrieren auf den Spieler
- **Stadtteil- und County-Namen** auf der Karte
- **Tag- und Nachtlook** nach der Spieluhr

### Blips
- **Jeder Blip einzeln** mit dem echten GTA-Icon in seiner Blip-Farbe
- Linke Leiste mit **Kategorien** (Banken, Geschäfte, Garagen, Werkstätten, Waffen, Kleidung, Essen, Dienste …)
- Gleichnamige Orte werden gruppiert, mit „Nächster“ und Entfernung
- **Infokarte** mit Name, Gebiet, Entfernung und optionalem Text

### Wegpunkt & GPS
- Wegpunkt per ENTER, Doppelklick oder Blip; es ist ein **echter GTA-Wegpunkt**, andere Scripts sehen ihn
- **GPS-Linie** folgt der echten GTA-Route auf Pausenkarte und Minimap, mit Routenlänge

### 3D-Minimap
- Ersetzt die GTA-Minimap: geneigt wie ein Navi, dreht mit der Kamera, zoomt mit der Geschwindigkeit raus
- Blips, Spielerpfeil, Wegpunkt und Route
- Bildrate begrenzt (Standard 30 FPS); kleine Gebäude außerhalb der Sicht werden nicht gezeichnet

### Einstellungen
- Aufbau wie in GTA: Tabs **Anzeige, Grafik, Audio, Sprachchat, Controller, Tastatur & Maus, Kamera, Replay, Tastenbelegung**
- Zeilen mit Liste („An 2 / 3 ‹ ›“), Schalter oder Schieberegler, Beschreibung rechts, Zähler „3 / 12“
- **Alle Werte werden live aus GTA gelesen**, Änderungen speichert GTA selbst (siehe [Wie es funktioniert](#einstellungen-1))
- „Standardwerte wiederherstellen“ pro Seite
- **Tastenbelegung** mit 13 Kategorien, Primär- und Sekundärtaste aus GTA gelesen

### Freie Kamera
- Für Screenshots: Geschwindigkeit, Sichtfeld, Rollwinkel und Drittel-Raster
- Begrenzter Radius um den Spieler (einstellbar)

---

## Installation

1. Repository herunterladen und den Ordner **`sky_pausemenu`** nach `resources/` kopieren.
2. **Kartendaten und Blip-Icons hinzufügen** (nicht im Repository enthalten, siehe unten).
3. In die `server.cfg` eintragen:
   ```cfg
   ensure sky_pausemenu
   ```
4. `config.lua` anpassen (Servername, Akzentfarbe, Shop, Hilfe).

### Kartendaten und Blip-Icons

Diese Dateien gehören nicht zum Code dieses Projekts und liegen deshalb **nicht** im Repository. Lege sie selbst hier ab:

| Datei | Inhalt | Pflicht |
|---|---|---|
| `html/map-data.js` | Kartendaten (`window.MAP3D_DATA`: Höhenraster, Formen, Gebäudehöhen) | ja, sonst bleibt die Karte leer |
| `html/zones.js` | Stadtteile und Countys (`window.MAP_ZONES`) | nein, nur für Gebietsnamen |
| `html/blips/<sprite-id>.webp` oder `.png` | Blip-Icons (z. B. `60.webp` = Polizei) | nein, sonst Kategorie-Icon |
| `html/img/settings-bg.jpg` | Hintergrund der Einstellungen | nein, sonst Farbverlauf mit Palmen |

---

## Tasten

| Taste | Funktion |
|---|---|
| `ESC` | Pausenmenü öffnen |
| `P` | Direkt die 3D-Karte öffnen |

**Pausenkarte**

| Eingabe | Funktion |
|---|---|
| Linke Maustaste ziehen | Karte verschieben |
| Rechte Maustaste ziehen / `Q` `E` | Drehen |
| Mausrad / `+` `-` | Zoomen |
| `V` | 2D / 3D |
| `R` | Auf Spieler zentrieren |
| `ENTER` | Wegpunkt setzen (gewählter Ort oder Kartenmitte) |
| Doppelklick | Wegpunkt an dieser Stelle |
| `ENTF` | Wegpunkt löschen |
| `↑` `↓` | Liste durchgehen |
| `←` `→` | Kategorie wechseln |
| `ESC` | Zurück |

**Einstellungen:** `↑` `↓` Zeile · `←` `→` Wert ändern · `Q` `E` Tab wechseln · `R` Seite zurücksetzen · `ESC` zurück

**Freie Kamera:** `W` `A` `S` `D` bewegen · `Shift` / `Strg` hoch/runter · Maus umsehen · Mausrad Sichtfeld · `Q` `E` Rollwinkel · `G` Raster · `H` Hinweise ausblenden · `ESC` zurück

---

## Konfiguration

| Datei | Was du dort einstellst |
|---|---|
| `config.lua` | Servername, Akzentfarbe, Einheiten, Tasten, Menüpunkte, Shop, Hilfe, Karte, Minimap, Route, Tag/Nacht, Blip-Kategorien, freie Kamera |
| `config_settings.lua` | Tabs und Zeilen der Einstellungen, Tastenbelegungs-Kategorien |

### Beispiele

**Blip-Kategorie hinzufügen** (Sprite-IDs: [docs.fivem.net/docs/game-references/blips](https://docs.fivem.net/docs/game-references/blips/))
```lua
Config.Categories = {
    { id = 'personal', label = 'PERSÖNLICH', icon = 'nav' },
    { id = 'bank', label = 'BANKEN & ATM', icon = 'money', sprites = { 108, 207, 500 } },
    -- …
}
```
Blips, deren Sprite in keiner Kategorie steht, landen unter **Persönlich**.

**GTA-Minimap behalten** (eigene Minimap aus)
```lua
Config.Minimap.enabled = false
```

**Einstellungszeile hinzufügen** (IDs: [docs.fivem.net/docs/game-references/profile-settings](https://docs.fivem.net/docs/game-references/profile-settings/))
```lua
{ id = 205, type = 'toggle', label = 'HUD', def = 1, desc = 'Blendet das HUD ein oder aus.' },
```
Typen: `list` (mit `opts`), `toggle`, `slider` (mit `min`/`max`), `info` (nur Anzeige), `native` (öffnet ein GTA-Menü).

---

## Exports

Alle Exports sind **clientseitig**.

```lua
-- Schöner Name und kurzer Text für einen Blip (Infokarte + Liste)
exports.sky_pausemenu:SetBlipInfo(blip, 'Pillbox Hospital', 'Hier wirst du behandelt')

-- Menü öffnen / schließen
exports.sky_pausemenu:Open('map')      -- 'home', 'map', 'game', 'store', 'help', 'camera', 'settings'
exports.sky_pausemenu:Close()
local open = exports.sky_pausemenu:IsOpen()

-- Eigene Minimap kurz ausblenden (z. B. Cutscene, Handy im Vollbild)
exports.sky_pausemenu:SetMinimapHidden(true)
```

### Beispiel: Blip mit Namen auf der Karte
```lua
local blip = AddBlipForCoord(425.1, -979.5, 30.7)
SetBlipSprite(blip, 60)
SetBlipColour(blip, 29)
BeginTextCommandSetBlipName('STRING')
AddTextComponentSubstringPlayerName('Police Station')
EndTextCommandSetBlipName(blip)

-- damit die Karte genau diesen Namen zeigt:
exports.sky_pausemenu:SetBlipInfo(blip, 'Police Station')
```

---

## Wie es funktioniert

### 3D-Karte
`html/map3d.js` liest die Kartendaten und baut daraus beim Start der NUI (ca. 1–2 s) Gelände, Wasser, Straßen, Brücken und Gebäude als three.js-Meshes. Die Farben für Tag und Nacht kommen per Shader, deshalb wird beim Wechsel nichts neu gebaut. Pausenkarte und Minimap teilen sich eine WebGL-Fläche.

### Blips
Der Client geht einmal pro Sekunde alle Blip-Sprites durch (`GET_FIRST_BLIP_INFO_ID` / `GET_NEXT_BLIP_INFO_ID`) und schickt Position, Farbe, Sprite und Anzeigeart an die NUI. Der Name kommt aus `SetBlipInfo`, aus `Config.BlipNames` oder vom GTA-eigenen Namen des Sprites (in der Spielsprache).

### GPS-Route
Die Linie wird aus `GET_POS_ALONG_GPS_TYPE_ROUTE` gebaut. Sie folgt also exakt der Route, die GTA berechnet.

### Einstellungen
- **Lesen:** `GET_PROFILE_SETTING` mit den offiziellen IDs.
- **Ändern:** Für Script-Änderungen an GTA-Einstellungen gibt es keine Native. Das Script öffnet deshalb GTAs eigenes Einstellungsmenü unsichtbar (`SUPPRESS_FRONTEND_RENDERING_THIS_FRAME`), steuert es per simuliertem Frontend-Tastendruck zur richtigen Zeile und stellt den Wert um. Danach liest es den Wert zur Kontrolle neu. GTA speichert die Änderung selbst.
- Die Position jeder Einstellung im GTA-Menü wird beim ersten Mal gesucht und danach gemerkt (KVP).

---

## Bekannte Grenzen

- **Blip-Namen aus anderen Scripts:** GTA kann den Namen, den ein Script mit `BeginTextCommandSetBlipName` setzt, nicht zurückgeben. Ohne `SetBlipInfo` steht der GTA-Name des Sprites da (z. B. „Polizeirevier“).
- **Grafik und Replay:** GTA übernimmt diese Optionen erst nach Bestätigung im eigenen Menü. Diese Zeilen öffnen deshalb das GTA-Menü.
- **Tasten neu belegen:** öffnet GTAs eigene Tastenbelegung bzw. die FiveM-Tastenbelegung für Script-Tasten.
- **GTA-Minimap ausgeblendet:** Damit verschwinden auch die GTA-Lebens- und Westenbalken. Nutzt dein HUD diese, setze `Config.Minimap.hideNative = false`.

---

## Fehlersuche

| Problem | Lösung |
|---|---|
| Karte bleibt leer / „Karte konnte nicht geladen werden“ | `html/map-data.js` fehlt oder ist nicht in `fxmanifest.lua` eingetragen |
| Blips zeigen nur Kategorie-Icons | `html/blips/<sprite>.webp` fehlt |
| Einstellung lässt sich nicht ändern (roter Rand) | In `config_settings.lua` `debug = true` setzen und die F8-Ausgabe (`[sky_pausemenu:settings]`) prüfen |
| Einstellungen springen in falsche Zeilen | `/pm_settingsreset` in F8 eingeben (löscht gemerkte Positionen) |
| ESC öffnet trotzdem das GTA-Menü | Ein anderes Script fängt ESC ab, oder eine andere NUI hat den Fokus |

---

## Credits

- [three.js](https://threejs.org/) (MIT-Lizenz) für das Rendern der Karte
- Tabelle der GTA-Tastencodes: [DemmyDemon](https://gist.github.com/DemmyDemon/69d53b78b005a7c1a6fdb9036e401f4c) und [cfx.re-Forum](https://forum.cfx.re/t/help-how-to-get-the-current-keybind-of-a-registered-keymap/1847600)
- Einstellungs-IDs: [Cfx.re Docs – Profile Settings](https://docs.fivem.net/docs/game-references/profile-settings/)
- Grand Theft Auto V und alle zugehörigen Inhalte gehören Rockstar Games / Take-Two Interactive
