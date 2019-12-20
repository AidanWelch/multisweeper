const WebSocket = require('ws'); 
const EventEmitter = require('events');
class UpdateEmitter extends EventEmitter {}
const updateEmitter = new UpdateEmitter();
var game = require('./gamehandler.js');
class Player {
    constructor( id, name, score ) {    
        this.id = id;
        this.name = name;
        this.score = score;
    }
}

const wss = new WebSocket.Server({ port: process.env.PORT || 81});
var players = [];
var map = game.MapGen();

function CreatePlayer(name){
    for( let i; i < players.length; i++ ){
        if( players[i] == null ){
            players[i] = new Player(i, name, 0);
            return i;
        }
    }
    players.push({id: players.length, name: name, score: 0});
    return players.length-1;
}



wss.on('connection', function connection(ws) {
    let id = null;
    ws.on('message', function incoming(message) {
        req = JSON.parse(message);
        if(req.operation == 'create'){
            id = CreatePlayer(req.data.name);
            updateEmitter.emit('update');
        }
        if(id != null){
            if(req.operation == 'click'){
                if(map[req.data.x][req.data.y].count == 'bomb'){
                    map = game.DeletePlayer(map, id);
                    updateEmitter.emit('update');
                    ws.send('loss');
                } else {
                    if(map[req.data.x][req.data.y].count == 0){
                        map[req.data.x][req.data.y].claimant_id = id;
                        map = game.ClaimNeighbors(map, req.data.x, req.data.y, id);
                        players[id] += 10;
                    } else {
                        map[req.data.x][req.data.y].claimant_id = id;
                        players[id]++;
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
        updateEmitter.emit('update');
    });

    updateEmitter.on('update', () => {
        let res = {
            map,
            id: id
        }
        res.map = game.GetPlayersMap(map, id);
        ws.send(JSON.stringify(res));
    });
    
});


function start(){
}

module.exports = {
    start
}