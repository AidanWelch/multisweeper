const WebSocket = require('ws'); 
const wss = new WebSocket.Server({ port: process.env.PORT || 80 });
/*
Player = {
    id,
    name,
    score
}
*/

var players = [];

function CreatePlayer(name){
    for( let i; i < players.length; i++ ){
        if( players[i] == null ){
            players[i] = {id: i, name: name, score: 0};
            return i;
        }
    }
    players.push({id: players.length+1, name: name, score: 0});
    return players.length+1;
}

function Click(id, x, y){
    
}


wss.on('connection', function connection(ws) {
    var id = null;
    ws.on('message', function incoming(message) {
        req = JSON.parse(message);
        if(req.operation == 'create'){
            id = CreatePlayer(req.data.name);
        }
        if(id != null){
            if(req.operation == 'click'){
                Click(id, req.data.x, req.data.y);
            }
        } else {
            ws.send('error');
        }
    });

    ws.send('something');
});