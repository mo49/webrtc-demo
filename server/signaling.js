"use strict";

// SDPの交換を自動化
const WebSocketServer = require('ws').Server
const port = 3001
const wsServer = new WebSocketServer({port: port})

wsServer.on('connection', (ws) => {
    ws.on('message', (message) => {
        wsServer.clients.forEach(function each(client){
            if(isSame(ws, client)){

            }else{
                client.send(message)
            }
        })
    })
})

function isSame(ws1, ws2){
    return (ws1 === ws2)
}
