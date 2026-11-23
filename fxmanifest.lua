fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'sky_pausemenu'
description 'Eigenes Pausenmenü mit 3D-Live-Karte, Blip-Liste, freier Kamera und GTA-Einstellungen'
version '1.0.0'

shared_scripts {
    'config.lua',
    'config_settings.lua',
}

client_scripts {
    'client/keynames.lua',
    'client/main.lua',
    'client/map.lua',
    'client/freecam.lua',
    'client/settings.lua',
}

server_script 'server/main.lua'

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/app.js',
    'html/map3d.js',
    'html/three.module.min.js',
    'html/map-data.js',
    'html/zones.js',
    'html/blips/*.png',
    'html/blips/*.webp',
    'html/img/*.jpg',
    'html/img/*.png',
}
