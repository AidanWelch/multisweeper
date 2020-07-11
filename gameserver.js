const WebSocket = require('ws'); 
const JOSC = require('joscompress');

const MAXPLAYERS = 1000;

var game = require('./gamehandler.js');

class Player {
    constructor( id, name ) {
        this.id = id;
        this.name = name;
        this.score = 0;
    }
}

class Connection {
    messageHandler (message){
        if(message !== 'Staying alive'){
            let req = InputSanitize(message);
            if(req.operation == 'create'){
                if(this.id != null){
                    map = game.DeletePlayer(map, this.id);
                    players[this.id] = null;
                    this.id = null;
                }
                this.id = CreatePlayer(req.data.name);
                map = game.SpawnPlayer(map, this.id);
                console.log(`Played ${this.id} created`);
                let win;
                [players, win] = game.UpdateScores(map, players);
                (win) ? Win() : Update();
            }
    
            if(this.id != null){
                if(
                    req.operation === 'click' && 
                    (req.data.x < game.DIMENSIONS && req.data.y < game.DIMENSIONS) &&
                    (req.data.x >= 0 && req.data.y >= 0) && 
                    (map[req.data.x][req.data.y].claimant_id === null || map[req.data.x][req.data.y].claimant_id === this.id)
                ){
                    if(map[req.data.x][req.data.y].count == 'bomb'){
                        ws.send('loss');
                        KillPlayer();
                    } else {
                        if(map[req.data.x][req.data.y].count == 0){
                            map[req.data.x][req.data.y].claimant_id = this.id;
                            map = game.ClaimNeighbors(map, req.data.x, req.data.y, this.id);
                        } else {
                            map[req.data.x][req.data.y].claimant_id = this.id;
                        }
                    }
                    let win;
                    [players, win] = game.UpdateScores(map, players);
                    (win) ? Win() : Update();
                }
            } else {
                ws.send('error');
            }
        }
    }

    commitSuicide (){
        connections.splice(connections.indexOf(this), 1);
    }

    constructor (ws) {
        this.ws = ws;
        this.id = null;
    }
}

var connections = [];

var schema = new JOSC({});

const wss = new WebSocket.Server({clientTracking: true, perMessageDeflate: true, port: 81});
var players = [];
var map = game.MapGen();

function CreatePlayer(name){
    let playersid;

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
    var connection = new Connection(ws);
    connections.push(connection);
    ws.on('message', function incoming(message) {
        connection.messageHandler(message);
    });

    function KillPlayer(){
        map = game.DeletePlayer(map, connection.id);
        players.splice(players.findIndex((player) => player.id === connection.id), 1);
        connection.id = null;
        Update();
    }


    ws.on('close', e => {KillPlayer(); connection.commitSuicide()});
});

function Update(){
    for (let connection of connections){
        let res = {
            id: connection.id,
            map,
            players: players
        }
        res.map = game.GetPlayersMap(map, connection.id);
        connection.ws.send(schema.encode(res));
    }
}

function Win(){
    for (let connection of connections){
        connection.ws.send('win');
        connection.id = null;
    }
    players = [];
    map = game.MapGen();
    Update();
}