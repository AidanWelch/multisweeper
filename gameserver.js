const WebSocket = require('ws'); 
const JOSC = require('joscompress');

const MAXPLAYERS = 1000;

var game = require('./gamehandler.js');
const e = require('express');

class Player {
    constructor( id, name, ws ) {    
        this.id = id;
        this.name = name;
        this.score = 0;
        this.ws = ws;
    }
}

var schema = new JOSC({});


const wss = new WebSocket.Server({clientTracking: true, perMessageDeflate: true, port: 81});
var players = [];
var map = game.MapGen();

function CreatePlayer(name, ws){
    let playersid = 0;

    for(playersid = 0; playersid < MAXPLAYERS; playersid++){
        if(players.findIndex((player) => player !== null && player.id === playersid) === -1){
            break;
        }
    }

    players.push(new Player(playersid, name, ws));
    return playersid;
}

function InputSanitize(message){
    let req;
    try {
        req = JSON.parse(message);
    } catch {
        req = {};
    }

    if(!(
        typeof req.operation !== 'undefined' &&
        (
            (
                req.operation === 'create' && typeof req.data.name === 'string'
            ) ||
            (
                req.operation === 'click' && 
                (
                    typeof req.data.x === 'number' &&
                    typeof req.data.y === 'number'
                )
            )
        )
    )){
        req.operation = 'fail';
    }

    return req;
}


wss.on('connection', function connection(ws) {
    ws.id = null;
    ws.id.id = null;

    ws.on('message', function incoming(message) {
        if(message !== 'Staying alive'){
            let req = InputSanitize(message);
            if(req.operation === 'create'){
                if(ws.id !== null){
                    map = game.DeletePlayer(map, ws.id);
                    players[ws.id] = null;
                    ws.id = null;
                }
                ws.id = CreatePlayer(req.data.name, ws);
                map = game.SpawnPlayer(map, ws.id);
                console.log(`Played ${ws.id} created`);
                let win;
                [players, win] = game.UpdateScores(map, players);
                UpdateClients(win);
            }
    
            if(ws.id != null){
                if(
                    req.operation === 'click' && 
                    (req.data.x < game.DIMENSIONS && req.data.y < game.DIMENSIONS) &&
                    (req.data.x >= 0 && req.data.y >= 0) && 
                    (map[req.data.x][req.data.y].claimant_id === null || map[req.data.x][req.data.y].claimant_id === ws.id)
                ){
                    if(map[req.data.x][req.data.y].count == 'bomb'){
                        ws.send('loss');
                        KillPlayer();
                    } else {
                        if(map[req.data.x][req.data.y].count == 0){
                            map[req.data.x][req.data.y].claimant_id = ws.id;
                            map = game.ClaimNeighbors(map, req.data.x, req.data.y, ws.id);
                        } else {
                            map[req.data.x][req.data.y].claimant_id = ws.id;
                        }
                    }
                    let win;
                    [players, win] = game.UpdateScores(map, players);
                    UpdateClients(win);
                }
            } else {
                ws.send('error');
            }
        }
    });

    function KillPlayer(){
        players.splice(players.findIndex((player) => player.id === ws.id), 1);
        ws.id = null;
        UpdateClients();
    }

    ws.on('close', e => {KillPlayer()});
});

function UpdateClients(win = false){
    let wipedMap = players.forEach((player) => {delete player.ws});
    for(var i = 0; i < players.length; i++){
        if(players[i]){
            if(win){
                players[i].ws.send('win');
                players[i].ws.id = null; //This is the only time in my life JS shallow object copy has helped me and not been a hassle
                players = [];
                map = game.MapGen();
                UpdateClients();
            } else {
                let res = {
                    id: players[i].ws.id,
                    map,
                    players: wipedMap
                }
                res.map = game.GetPlayersMap(map, ws.id);
                players[i].ws.send(schema.encode(res));
            }
        }
    }
}
