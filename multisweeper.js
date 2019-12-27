const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const DIMENSIONS = 1000;
const socket = new WebSocket('ws' + window.location.href.slice(4, -1) + ':81');
if (window.location.href[4] == "s"){
    const socket = new WebSocket('ws' + window.location.href.slice(5, -1) + ':81');
} else {
    const socket = new WebSocket('ws' + window.location.href.slice(4, -1) + ':81');
}

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

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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
    if(canvas.width < canvas.height){
        return (Math.floor(canvas.width/50));
    } else {
        return (Math.floor(canvas.height/50));
    }
}

function GetTileSize(){
    if(canvas.width > canvas.height){
        return (canvas.width/GetTileCount());
    } else {
        return (canvas.height/GetTileCount());
    }
}

var view_x = 0;
var view_y = 0;

function Draw(tile) {
    let x = tile.x-view_x;
    let y = tile.y-view_y;
    if(tile.claimant_id == null){
        ctx.fillStyle = colors.tile_top; //GetColor(Math.floor(Math.random()*1000));
    }   else {
        ctx.fillStyle = GetColor(tile.claimant_id);
    }
    ctx.fillRect((x * GetTileSize()), (y * GetTileSize()), GetTileSize()-1, GetTileSize()-1);
    if(flaggedTiles.findIndex((flagged) => {
        return (flagged[0] == tile.x) && (flagged[1] == tile.y);
    }) != -1){
        ctx.fillStyle = colors.flag;
        ctx.fillRect((x * GetTileSize())+10, (y * GetTileSize())+10, GetTileSize()-21, GetTileSize()-21);
        ctx.fillStyle = colors.walls;
        ctx.strokeRect((x * GetTileSize())+10, (y * GetTileSize())+10, GetTileSize()-21, GetTileSize()-21);
    }
    if(tile.count != null){
        ctx.fillStyle = colors.walls;
        ctx.fillText(tile.count, x+1, y+1, GetTileSize-1);
        ctx.fillStyle = colors.white;
        ctx.strokeText(tile.count, x+1, y+1, GetTileSize-1);
    }
}

function DrawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let x = view_x; x < GetTileCount(); x++){
        for(let y = view_y; y < GetTileCount(); y++){
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

socket.onmessage = function(recieved) {
    if (recieved != 'error' || recieved != 'loss'){
        ClearMap();
        let res = JSON.parse(recieved.data);
        for(let i = 0; i < res.map.length; i++){
            map[res.map[i].x][res.map[i].y] = res.map[i];
        }
        DrawAll();
    } else if (recieved == 'loss') {
        ///TODO Insert bringing up create menu and loss screen

    } else {
        alert("Somehow you managed to avoid creating an account, please refresh the page.");
    }
}

socket.onopen = function(e) {
    function Game () {
        ClearMap();
        socket.send(JSON.stringify(new Request('create', {name: 'test'})));
    }
    Game();
}

function GetSelectedTile(event){
    let bounds = canvas.getBoundingClientRect();
    let x = event.clientX - bounds.left;
    let y = event.clientY - bounds.top;
    x = Math.floor(x/GetTileSize())+view_x;
    y = Math.floor(y/GetTileSize())+view_y;
    return [x,y];
}

canvas.addEventListener('contextmenu', function(event) {
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
});

canvas.addEventListener('click', function(event) {
    event.preventDefault();
    let tile = GetSelectedTile(event);
    socket.send(JSON.stringify(new Request('click', {x: tile[0], y: tile[1]})));
});
