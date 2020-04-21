const WebSocket = require('ws'); 
const EventEmitter = require('events');
class UpdateEmitter extends EventEmitter {}
const updateEmitter = new UpdateEmitter();
updateEmitter.setMaxListeners(999);
var game = require('./gamehandler.js');
class Player {
    constructor( id, name ) {    
        this.id = id;
        this.name = name;
        this.score = 0;
    }
}

const wss = new WebSocket.Server({ port: process.env.PORT || 81});
var players = [];
var map = game.MapGen();

function CreatePlayer(name){
    let playersid = 0;

    for(playersid = 0; playersid < 1000; playersid++){
        if(players.findIndex((player) => player.id === playersid) === -1){
            break;
        }
    }

    players.push(new Player(playersid, name));
    return playersid;
}



wss.on('connection', function connection(ws) {
    var id = null;

    ws.on('message', function incoming(message) {
        let req = JSON.parse(message);
        if(req.operation == 'create'){
            if(id != null){
                map = game.DeletePlayer(map, id);
                players[id] = null;
                id = null;
            }
            id = CreatePlayer(req.data.name);
            map = game.SpawnPlayer(map, id);
            console.log(`Played ${id} created`);
            updateEmitter.emit('update');
        }

        if(id != null){
            if(
                req.operation === 'click' && 
                (req.data.x < game.DIMENSIONS && req.data.y < game.DIMENSIONS) &&
                (req.data.x >= 0 && req.data.y >= 0) && 
                (map[req.data.x][req.data.y].claimant_id === null || map[req.data.x][req.data.y].claimant_id === id)
            ){
                if(map[req.data.x][req.data.y].count == 'bomb'){
                    ws.send('loss');
                    KillPlayer();
                } else {
                    if(map[req.data.x][req.data.y].count == 0){
                        map[req.data.x][req.data.y].claimant_id = id;
                        map = game.ClaimNeighbors(map, req.data.x, req.data.y, id);
                    } else {
                        map[req.data.x][req.data.y].claimant_id = id;
                    }
                    updateEmitter.emit('update');
                }
            }
        } else {
            ws.send('error');
        }
    });

    function KillPlayer(){
        map = game.DeletePlayer(map, id);
        players.splice(players.findIndex((player) => player.id === id), 1);
        id = null;
        updateEmitter.emit('update');
    }
    
    var updateListener = function(event) {
        let res = {
            id: id,
            map,
            players: players
        }
        res.map = game.GetPlayersMap(map, id);
        ws.send(JSON.stringify(res));
    }

    ws.on('close', e => {KillPlayer(); updateEmitter.removeListener('update', updateListener, true)});

    updateEmitter.on('update', updateListener, true);
    
});
