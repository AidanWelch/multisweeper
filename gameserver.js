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
    for(let i = 0; i < players.length; i++ ){
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
            console.log(`Played ${id} created`);
            updateEmitter.emit('update');
        }
        if(id != null){
            if(req.operation == 'click'){
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
                        players[id].score += 10;
                    } else {
                        map[req.data.x][req.data.y].claimant_id = id;
                        players[id].score++;
                    }
                    updateEmitter.emit('update');
                }
            }
        } else {
            ws.send('error');
        }
    });

    function updateListener () {
        let res = {
            map,
            id: id
        }
        res.map = game.GetPlayersMap(map, id);
        ws.send(JSON.stringify(res));
    }

    ws.on('close', function closing(e) {
        map = game.DeletePlayer(map, id);
        players[id] = null;
        id = null;
        updateEmitter.removeListener('update', updateListener);
        updateEmitter.emit('update');
    });

    updateEmitter.on('update', updateListener);
    
});


function start(){
}

module.exports = {
    start
}