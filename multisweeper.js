const canvas = document.querySelector("canvas");
const scoreboard = document.getElementById("scoreboard");
const loading = document.getElementsByClassName("loading");
const menubox = document.getElementById("menubox");

const ctx = canvas.getContext("2d");
const DIMENSIONS = 100;
const socket = new WebSocket('ws' + window.location.href.slice(4, -1) + ':81');
/*
if (window.location.href[4] == "s"){
    const socket = new WebSocket('ws' + window.location.href.slice(5, -1) + ':81');
} else {
    const socket = new WebSocket('ws' + window.location.href.slice(4, -1) + ':81');
}
*/

class Tile {
    constructor( x, y ) {    
        this.x = x;
        this.y = y;
        this.claimant_id = null;
        this.count = null;
    }
}

var flaggedTiles = [];
var map = [];
var id = null;
var players = null;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var tileSizeMultiplier = 1;

window.onresize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (DrawAll != null){
        DrawAll();
    }
}

const colors = {
    tile_top: '#969696',
    tile_sides: '#646464',
    flag: '#ff0000',
    ground: '#c8c8c8',
    walls: '#000000',
    white: '#ffffff'
}

class Request {
    constructor (operation, data){
        this.operation = operation;
        this.data = data;
    }
}

function GetColor(id){
    id = id.toString().split('');
    let h = 40 * id.pop();
    let s = 100;
    let l = 50;
    if(id.length > 0){
        s = 10 * id.pop();
        if(id.length > 0){
            v = (5 * (id.pop() + 1)) + 50;
        }
    }
    return `hsl(${h}, ${s}%, ${l}%)`;
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

var view_x = 0;
var view_y = 0;

function Draw(tile) {
    let x = tile.x-view_x;
    let y = tile.y-view_y;
    if(tile.claimant_id == null){
        ctx.fillStyle = colors.tile_top; //DEBUG ONLY GetColor(Math.floor(Math.random()*1000));
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
        ctx.fillStyle = colors.walls;
        ctx.fillText(tile.count.toString(), x*GetTileSize()+(GetTileSize()/5), (y*GetTileSize())+(GetTileSize()*0.85));
        ctx.font = `${GetTileSize()}px Verdana`;
        ctx.strokeStyle = colors.white;
        ctx.strokeText(tile.count.toString(), x*GetTileSize()+(GetTileSize()/5), (y*GetTileSize())+(GetTileSize()*0.85));
    }
}

function DrawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let x = Math.floor(view_x); x < GetTileCount() + Math.floor(view_x); x++){
        for(let y = Math.floor(view_y); y < GetTileCount() + Math.floor(view_y); y++){
            Draw(map[x][y]);
        }
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

function GetScores (){
    for(let i = 0; i < players.length; i++){
        if(players[i] != null){
            players[i].score = 0;
        }
    }
    for(let x = 0; x < DIMENSIONS; x++){
        for(let y = 0; y < DIMENSIONS; y++){
            if(map[x][y].claimant_id != null){
                if(players[map[x][y].claimant_id] != null){
                    players[map[x][y].claimant_id].score++;
                }
            }
        }
    }
    players.sort(function(a,b){return a.score - b.score});
    let max = 0;
    if(players.length < 10){
        max = players.length;
    } else {
        max = 9;
    }
    for(let i = 0; i < max; i++){
        if(players[i] != null){
            let row = scoreboard.insertRow(i);
            row.insertCell(0).innertHTML = i+1;
            row.insertCell(1).innertHTML = players[i].name;
            row.insertCell(2).innertHTML = players[i].score;
        }
    }
} 

socket.onmessage = function(recieved) {
    if (recieved.data != 'error' && recieved.data != 'loss'){
        ClearMap();
        let res = JSON.parse(recieved.data);
        id = res.id;
        for(let i = 0; i < res.map.length; i++){
            map[res.map[i].x][res.map[i].y] = res.map[i];
        }
        players = res.players;
        GetScores();
        DrawAll();
    } else if (recieved.data == 'loss') {
        id = null;
        flaggedTiles = [];
        if(Game != null){
            Game();
        } else {
            alert("Something went wrong, please refresh the page.");
        }
    } else {
        alert("Somehow you managed to avoid creating an account, please refresh the page.");
    }
}

var Game = null;
socket.onopen = function(e) {
    for(let i = 0; i < loading.length; i++){
        loading[i].style.display = "none";
    }
    Game = function () {
        menubox.style.display = 'block';
        ClearMap();
        DrawAll();
        document.getElementById("startbutton").onclick = () =>{
            socket.send(JSON.stringify(new Request('create', {name: document.getElementById("nickname").value})));
            menubox.style.display = 'none';
        };
    }
    Game();
}

function GetSelectedTile(event){
    let bounds = canvas.getBoundingClientRect();
    let x = event.clientX - bounds.left;
    let y = event.clientY - bounds.top;
    x = Math.floor(x/GetTileSize())+Math.floor(view_x);
    y = Math.floor(y/GetTileSize())+Math.floor(view_y);
    return [x,y];
}

canvas.addEventListener('contextmenu', function(event) {
    if(id != null){
        event.preventDefault();
        let tile = GetSelectedTile(event);
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
});

canvas.addEventListener('click', function(event) {
    if(id != null){
        event.preventDefault();
        let tile = GetSelectedTile(event);
        if(flaggedTiles.findIndex((flagged) => {
            return (flagged[0] == tile[0]) && (flagged[1] == tile[1]);
        }) == -1){
            socket.send(JSON.stringify(new Request('click', {x: tile[0], y: tile[1]})));
        }
    }
});

window.addEventListener('keydown', (event) => {
    if(id != null){
        event.preventDefault();
        if(event.key == 'Tab'){
            scoreboard.style.display = "block";
        } else if (event.key == 'w' || event.key == "ArrowUp") {
            if(view_y > 0){
                view_y -= 0.1;
                DrawAll();
            }
        } else if (event.key == 's' || event.key == "ArrowDown") {
            if(view_y < DIMENSIONS){
                view_y += 0.1;
                DrawAll();
            }
        } else if (event.key == 'a' || event.key == "ArrowLeft") {
            if(view_x > 0){
                view_x -= 0.1;
                DrawAll();
            }
        } else if (event.key == 'd' || event.key == "ArrowRight") {
            if(view_x < DIMENSIONS){
                view_x += 0.1;
                DrawAll();
            }
        }
    }
}, false);

window.addEventListener("wheel", event => {
    if(id != null){
        event.preventDefault();
        if(event.deltaY > 0){
            tileSizeMultiplier += 0.1;
        } else if (event.deltaY < 0 && tileSizeMultiplier > 0) {
            tileSizeMultiplier -= 0.1;
        }
        DrawAll();
    }
});

window.addEventListener('keyup', (event) => {
    event.preventDefault();
    if(event.key == 'Tab'){
        scoreboard.style.display = "none";
    }
}, false);