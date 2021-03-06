const JOSC = joscompress;

const canvas = document.querySelector("canvas");
const loading = document.getElementsByClassName("loading");
const menubox = document.getElementById("menubox");
const reversezoom = document.getElementById("reversezoom");
const endtext = document.getElementById("endtext");
const colormode = document.getElementById("colormode");

const ctx = canvas.getContext("2d");
const DIMENSIONS = 100;
const socket = new WebSocket('wss://' + window.location.host + '/ws/');

class Tile {
    constructor( x, y ) {    
        this.x = x;
        this.y = y;
        this.claimant_id = null;
        this.count = null;
    }
}

var responseSchema = {
    id: 'int',
    map: [{
        x: 'int',
        y: 'int',
        claimant_id: 'int',
        count: 'int'
    }],
    players: [{
        id: 'int',
        name: 'string',
        score: 'int'
    }]
}

///COLOR DEFINITION:
const ColorModes = {
    default: {
        colors: {
            unclaimed_tile: '#969696',
            walls: '#000000',
            text: '#000000',
            outline: '#ffffff'
        },
        GetColor(color_id){
            color_id = color_id.toString().split('');
            let h = 40 * color_id.pop();
            let s = 100;
            let l = 50;
            if(color_id.length > 0){
                s = 10 * color_id.pop();
                if(color_id.length > 0){
                    l = (5 * (color_id.pop() + 1)) + 50;
                }
            }
            return `hsl(${h}, ${s}%, ${l}%)`;
        }
    },
    darker: {
        colors: {
            unclaimed_tile: '#5C5C5C',
            walls: '#000000',
            text: '#000000',
            outline: '#ffffff'
        },
        GetColor(color_id){
            color_id = color_id.toString().split('');
            let h = 40 * color_id.pop();
            let s = 100;
            let l = 20;
            if(color_id.length > 0){
                s = 10 * color_id.pop();
            }
            return `hsl(${h}, ${s}%, ${l}%)`;
        }
    },
    redenemies: {
        colors: {
            unclaimed_tile: '#969696',
            walls: '#000000',
            text: '#000000',
            outline: '#ffffff'
        },
        GetColor(color_id){
            if(color_id === id){
                return '#5C5C5C';
            } else {
                return '#FF0000';
            }
        }
    },
    darkmode: {
        colors: {
            unclaimed_tile: '#5C5C5C',
            walls: '#000000',
            text: '#000000',
            outline: '#ffffff'
        },
        GetColor(color_id){
            color_id = color_id.toString().split('');
            let h = 40 * color_id.pop();
            let s = 100;
            let l = 20;
            if(color_id.length > 0){
                s = 10 * color_id.pop();
            }
            return `hsl(${h}, ${s}%, ${l}%)`;
        }
    }
}

var colors;

var GetColor;

function UpdateColorMode(){
    colors = ColorModes[colormode.value].colors;
    GetColor = ColorModes[colormode.value].GetColor;
}


///////////////////

const schema = new JOSC(responseSchema);

var flaggedTiles = [];
var map = [];
var id = null;
var players = null;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var tileSizeMultiplier = 1;

var showScoreboard = false;

window.onresize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (DrawAll != null){
        DrawAll();
    }
}

class Request {
    constructor (operation, data){
        this.operation = operation;
        this.data = data;
        lastResponseTime = new Date().getTime();
    }
}

function GetTileCount(){
    if(canvas.width > canvas.height){
        return Math.ceil(canvas.width / (tileSizeMultiplier*50));
    } else {
        return Math.ceil(canvas.height / (tileSizeMultiplier*50));
    }
}

function GetTileSize(){
    if(canvas.width > canvas.height){
        return Math.ceil(canvas.width/GetTileCount()+1);
    } else {
        return Math.ceil(canvas.height/GetTileCount()+1);
    }
}

function MoveWithAnchor( oldx, oldy, event ) {
    let [curx, cury] = GetSelectedTile(event);
    view_x += oldx-curx;
    view_y += oldy-cury;
    
}

var view_x = 0;
var view_y = 0;

function Draw(tile) {
    let x = tile.x-view_x;
    let y = tile.y-view_y;
    if(tile.claimant_id == null){
        ctx.fillStyle = colors.unclaimed_tile; //DEBUG ONLY GetColor(Math.floor(Math.random()*1000));
    }   else {
        ctx.fillStyle = GetColor(tile.claimant_id);
    }
    ctx.fillRect((x * GetTileSize()), (y * GetTileSize()), GetTileSize()-1, GetTileSize()-1);
    if(flaggedTiles.findIndex((flagged) => {
        return (flagged[0] == tile.x) && (flagged[1] == tile.y);
    }) != -1){
        ctx.fillStyle = GetColor(id);
        ctx.fillRect((x * GetTileSize())+(GetTileSize()*0.1), (y * GetTileSize())+(GetTileSize()*0.1), GetTileSize()-(GetTileSize()*0.21), GetTileSize()-(GetTileSize()*0.21));
        ctx.strokeStyle = colors.walls;
        ctx.strokeRect((x * GetTileSize())+(GetTileSize()*0.1), (y * GetTileSize())+(GetTileSize()*0.1), GetTileSize()-(GetTileSize()*0.21), GetTileSize()-(GetTileSize()*0.21));
    }
    if(tile.count > 0){
        ctx.font = `${GetTileSize()}px Verdana`;
        ctx.fillStyle = colors.text;
        ctx.fillText(tile.count.toString(), x*GetTileSize()+(GetTileSize()/5), (y*GetTileSize())+(GetTileSize()*0.85));
        ctx.font = `${GetTileSize()}px Verdana`;
        ctx.strokeStyle = colors.outline;
        ctx.strokeText(tile.count.toString(), x*GetTileSize()+(GetTileSize()/5), (y*GetTileSize())+(GetTileSize()*0.85));
    }
}

function DrawAll() {
    UpdateColorMode();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let x_max = GetTileCount() + Math.floor(view_x);
    let y_max = GetTileCount() + Math.floor(view_y);
    let x_min = Math.max(Math.floor(view_x), 0);
    let y_min = Math.max(Math.floor(view_y), 0);
    if(DIMENSIONS - (Math.floor(view_x)+GetTileCount()) < GetTileCount()){
        x_max = DIMENSIONS;
    }
    if(DIMENSIONS - (Math.floor(view_y)+GetTileCount()) < GetTileCount()){
        y_max = DIMENSIONS;
    }
    for(let x = x_min; x < x_max; x++){
        for(let y = y_min; y < y_max; y++){
            Draw(map[x][y]);
        }
    }
    if(showScoreboard){
        DrawScores(SortPlayers());
    }
}

function ClearMap(){
    for(let x = 0; x < DIMENSIONS; x++){
        if(!map[x]){
            map.push([]);
        } else {
            map[x] = []
        }
        for(let y = 0; y < DIMENSIONS; y++){
            if(!map[x][y]) {
                map[x].push(new Tile(x,y));
            } else {
                map[x][y] = new Tile(x,y);
            }
        }
    }
}

function DrawScores (scores){
    let max;
    if(scores.length < 10){
        max = scores.length;
    }

    function DrawRow (score, place, is_player = false) {
        var drawPlace = place;
        if(is_player){
            drawPlace = 11;
        }
        ctx.lineWidth = 5;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = GetColor(score.id);
        ctx.fillRect(0.1*canvas.width, 0.05*drawPlace*canvas.height, canvas.width*0.8, canvas.height*0.05);
        ctx.globalAlpha = 1;
        ctx.fillStyle = colors.text;
        ctx.strokeStyle = colors.text;
        ctx.font = `${Math.floor(canvas.height*0.05)}px Verdana`;
        ctx.strokeRect(0.1*canvas.width, 0.05*drawPlace*canvas.height, canvas.width*0.1, canvas.height*0.05);
        ctx.fillText(place, 0.11*canvas.width, Math.round(canvas.height*0.05*drawPlace) + Math.round(0.05*canvas.height) - 3);
        ctx.strokeRect(0.2*canvas.width, 0.05*drawPlace*canvas.height, canvas.width*0.55, canvas.height*0.05);
        ctx.fillText(score.name, 0.21*canvas.width, Math.round(canvas.height*0.05*drawPlace) + Math.round(0.05*canvas.height) - 3);
        ctx.strokeRect(0.75*canvas.width, 0.05*drawPlace*canvas.height, 0.15*canvas.width, canvas.height*0.05);
        ctx.fillText(score.score, 0.76*canvas.width, Math.round(canvas.height*0.05*drawPlace) + Math.round(0.05*canvas.height) - 3);
        ctx.lineWidth = 1;
    }
    let player_drawn = false;
    for(let i = 0; i < (max || 10); i++){
        if(scores[i]){
            DrawRow(scores[i], i+1);
            player_drawn = (scores[i].id === id || player_drawn);
        }
    }
    if(!player_drawn){
        DrawRow(scores[GetPlayerIndex(scores, id)], GetPlayerIndex(scores, id)+1, true);
    }
}

function SortPlayers (){
    players.sort(function(a,b){
        if(a != null && b != null){
            return b.score - a.score;
        } else {
            if(a == null){
                return 1;
            } else {
                return -1;
            }
        }
    });
    return players;
}

function GetPlayerIndex (players, targetid){
    return players.findIndex((player) => player.id === targetid);
}

function CenterOnSpawn (map) {
    let spawnpoint = map.findIndex(tile => {
        if(tile.claimant_id == id){
            return true;
        }
    });
    tileSizeMultiplier = 1;
    if(spawnpoint !== -1){
        view_x = map[spawnpoint].x - (Math.ceil(canvas.width / (tileSizeMultiplier*50))/2);
        view_y = map[spawnpoint].y - (Math.ceil(canvas.height / (tileSizeMultiplier*50))/2);
    }
}

socket.onmessage = function(recieved) {
    lastResponseTime = new Date().getTime();
     if (recieved.data === 'loss') {
        let lastScore = players[GetPlayerIndex(players, id)].score;
        id = null;
        flaggedTiles = [];
        if(Game !== null){
            Game(lastScore);
        } else {
            alert("Somehow you lost before starting the game, please refresh the page.");
        }
    } else if (recieved.data === 'win') {
        let lastScore = players[GetPlayerIndex(players, id)].score;
        let winner = players[0];
        winner.isPlayer = winner.id === id; 
        id = null;
        flaggedTiles = [];
        if(Game !== null){
            Game(lastScore, winner);
        } else {
            alert("Some strange error occured, please refresh the page.");
        }
    } else if (recieved.data !== 'error'){
        ClearMap();
        let res = schema.decode(recieved.data);
        if(id == null){
            id = res.id;
            CenterOnSpawn(res.map);
        }
        id = res.id;
        for(let i = 0; i < res.map.length; i++){
            map[res.map[i].x][res.map[i].y] = res.map[i];
        }
        players = res.players;
        SortPlayers();
        DrawAll();
    } else {
        alert("Somehow you managed to avoid creating an account, please refresh the page.");
    }
}

function SignUp(){
    socket.send(JSON.stringify(new Request('create', {name: document.getElementById("nickname").value})));
    menubox.style.display = 'none';
}

var Game = null;
socket.onopen = function(e) {
    for(let i = 0; i < loading.length; i++){
        loading[i].style.display = "none";
    }
    Game = function (lastScore = null, winner = null) {
        menubox.style.display = "block";
        if(winner !== null){
            endtext.innerHTML = (winner.isPlayer) ? `You won!  You had claimed ${lastScore} tiles.` : `"${winner.name}" won!  You had claimed ${lastScore} tiles.`;
            endtext.style.display = "block";
        } else if (lastScore !== null){
            endtext.innerHTML = `You lost!  You had claimed ${lastScore} tiles.`;
            endtext.style.display = "block";
        }
        ClearMap();
        DrawAll();
        document.getElementById("startbutton").onclick = () =>{
            SignUp();
        };
    }
    lastResponseTime = new Date().getTime();
    KeepAlive();
    Game();
}

var lastResponseTime;
async function KeepAlive(){
    setInterval(() => {
        if(new Date().getTime() > lastResponseTime + 10000){
            if(socket.readyState === socket.OPEN){
                socket.send('Staying alive');
            } else {
                alert("This page has been timed out by your browser");
                location.reload();
            }
            lastResponseTime = new Date().getTime();
        }
    }, 10)
}

function GetSelectedTile(event){
    let bounds = canvas.getBoundingClientRect();
    let x = event.clientX - bounds.left;
    let y = event.clientY - bounds.top;
    x = Math.floor(x/GetTileSize()+view_x);
    y = Math.floor(y/GetTileSize()+view_y);
    return [x,y];
}

canvas.addEventListener('contextmenu', function(event) {
    if(id != null){
        event.preventDefault();
        let tile = GetSelectedTile(event);
        if(map[tile[0]][tile[1]].claimant_id === null){
            if(flaggedTiles.findIndex((flagged) => {
                return (flagged[0] == tile[0]) && (flagged[1] == tile[1]);
            }) == -1){
                flaggedTiles.push(tile);
            } else {
                flaggedTiles = flaggedTiles.filter((flagged) => {
                    return (flagged[0] != tile[0]) || (flagged[1] != tile[1]);
                });
            }
            DrawAll();
        }
    }
});


canvas.addEventListener('mousedown', function(event) {
    if(id != null && (event.button === 0 || event.button == 1)){
        event.preventDefault();
        var pressed = new Date().getTime();
        var tile = GetSelectedTile(event);
        var released = false;
        var moved = false

        canvas.addEventListener('mousemove', function(event) {
            event.preventDefault();
            if(!released && new Date().getTime() - pressed > 100){
                moved = true;
                MoveWithAnchor(tile[0], tile[1], event);
                DrawAll();
            }
        });

        canvas.addEventListener('mouseup', function(event) {
            event.preventDefault();
            released = true;
            if((new Date().getTime() - pressed < 200 && !moved) && event.button === 0){
                if(flaggedTiles.findIndex((flagged) => {
                    return (flagged[0] == tile[0]) && (flagged[1] == tile[1]);
                }) == -1){
                    if(socket.readyState === socket.OPEN){
                        socket.send(JSON.stringify(new Request('click', {x: tile[0], y: tile[1]})));
                    } else {
                        alert("This page has been timed out by your browser");
                        location.reload();
                    }
                }
            }
        });
    }
});

window.addEventListener('keydown', (event) => {
    if(id !== null){
        let step = Math.log(10*(1/tileSizeMultiplier));
        if(event.key == 'Tab'){
            event.preventDefault();
            showScoreboard = true;
            DrawAll();
        } else if (event.key == 'w' || event.key == "ArrowUp") {
            if(view_y >= step){
                view_y -= step;
                DrawAll();
            }
        } else if (event.key == 's' || event.key == "ArrowDown") {
            if(view_y + step <= DIMENSIONS){
                view_y += step;
                DrawAll();
            }
        } else if (event.key == 'a' || event.key == "ArrowLeft") {
            if(view_x >= step){
                view_x -= step;
                DrawAll();
            }
        } else if (event.key == 'd' || event.key == "ArrowRight") {
            if(view_x + step <= DIMENSIONS){
                view_x += step;
                DrawAll();
            }
        }
    } else if (menubox.style.display !== 'none'){
        if (event.key == "Enter") {
            SignUp();
        }
    }
}, false);

window.addEventListener("wheel", event => {
    var zoomScale = reversezoom.checked ? -0.1 : 0.1;
    if(id != null){
        let tile = GetSelectedTile(event);
        tileSizeMultiplier = tileSizeMultiplier + ((event.deltaY < 0) ? zoomScale :  -zoomScale);
        tileSizeMultiplier = (tileSizeMultiplier > 2) ? 2 : tileSizeMultiplier;
        tileSizeMultiplier = (tileSizeMultiplier < Math.abs(zoomScale)) ? Math.abs(zoomScale) : tileSizeMultiplier;
        MoveWithAnchor(tile[0], tile[1], event);
        DrawAll();
    }
});

window.addEventListener('keyup', (event) => {
    if(event.key == 'Tab'){
        event.preventDefault();
        showScoreboard = false;
        DrawAll();
    }
}, false);