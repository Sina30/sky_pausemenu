-- sky_pausemenu: Server (nur "Verbindung trennen")

RegisterNetEvent('sky_pausemenu:disconnect', function()
    DropPlayer(source, 'Du hast die Verbindung über das Pausenmenü getrennt.')
end)
