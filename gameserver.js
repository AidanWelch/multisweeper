const WebSocket = require('ws'); 
const EventEmitter = require('events');
class UpdateEmitter extends EventEmitter {}
const updateEmitter = new UpdateEmitter();
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
    for(let i = 0; i < players.length; i++ ){
        if( players[i] == null ){
            players[i] = new Player(i, name);
            return i;
        }
    }
    players.push(new Player(players.length, name));
    return players.length-1;
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
            console.log(`Played ${id} created`);
            updateEmitter.emit('update');
        }
        if(id != null){
            if(req.operation == 'click' && (map[req.data.x][req.data.y].claimant_id == null || map[req.data.x][req.data.y].claimant_id == id)){
                if(map[req.data.x][req.data.y].count == 'bomb'){
                    map = game.DeletePlayer(map, id);
                    ws.send('loss');
                    players[id] = null;
                    id = null;
                    updateEmitter.emit('update');
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

    ws.on('close', function closing(e) {
        map = game.DeletePlayer(map, id);
        players[id] = null;
        id = null;
        updateEmitter.removeListener('update', e => updateListener(e, id, ws));
        updateEmitter.emit('update');
    });

    updateEmitter.on('update', e => updateListener(e, id, ws));
    
});

function updateListener (e, id, ws) {
    let res = {
        id: id,
        map,
        players: players
    }
    res.map = game.GetPlayersMap(map, id);
    ws.send(JSON.stringify(res));
}
