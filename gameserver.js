const WebSocket = require('ws'); 
const JOSC = require('joscompress');
const EventEmitter = require('events');
class UpdateEmitter extends EventEmitter {};
const updateEmitter = new UpdateEmitter();

const MAXPLAYERS = 1000;
updateEmitter.setMaxListeners(MAXPLAYERS);

var game = require('./gamehandler.js');

class Player {
    constructor( id, name ) {    
        this.id = id;
        this.name = name;
        this.score = 0;
    }
}

var schema = new JOSC({});

module.exports = ((express = undefined) => {
    const wss = new WebSocket.Server({server: express, clientTracking: true, perMessageDeflate: true});
    var players = [];
    var map = game.MapGen();

    function CreatePlayer(name){
        let playersid = 0;

        for(playersid = 0; playersid < MAXPLAYERS; playersid++){
            if(players.findIndex((player) => player !== null && player.id === playersid) === -1){
                break;
            }
        }

        players.push(new Player(playersid, name));
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

        ws.on('message', function incoming(message) {
            if(message !== 'Staying alive'){
                let req = InputSanitize(message);
                if(req.operation == 'create'){
                    if(ws.id != null){
                        map = game.DeletePlayer(map, ws.id);
                        players[ws.id] = null;
                        ws.id = null;
                    }
                    ws.id = CreatePlayer(req.data.name);
                    map = game.SpawnPlayer(map, ws.id);
                    console.log(`Played ${ws.id} created`);
                    let win;
                    [players, win] = game.UpdateScores(map, players);
                    (win) ? Win() : updateEmitter.emit('update');
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
                        (win) ? Win() : updateEmitter.emit('update');
                    }
                } else {
                    ws.send('error');
                }
            }
        });

        function Win(){
            for (let client of wss.clients){
                client.send('win');
                client.id = null;
            }
            players = [];
            map = game.MapGen();
            updateEmitter.emit('update');
        }

        function KillPlayer(){
            map = game.DeletePlayer(map, ws.id);
            players.splice(players.findIndex((player) => player.id === ws.id), 1);
            ws.id = null;
            updateEmitter.emit('update');
        }
        
        var updateListener = function(event) {
            let res = {
                id: ws.id,
                map,
                players: players
            }
            res.map = game.GetPlayersMap(map, ws.id);
            ws.send(schema.encode(res));
        }

        ws.on('close', e => {KillPlayer(); updateEmitter.removeListener('update', updateListener, true)});

        updateEmitter.on('update', updateListener, true);
        
    });
});