const canvas = document.querySelector("canvas");
const scoreboard = document.querySelector("table");
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

var lastScore = null;

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

function ZoomWithAnchor( oldx, oldy, event ) {
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
        DrawScores(GetScores());
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
    let max = 0;
    if(scores.length <= 10){
        max = scores.length;
    } else {
        max = 10;
        scores.splice(9, 0, scores.splice(scores[GetScoresIndex(scores, id)], 1));
    }

    function DrawRow (score, place) {
        ctx.lineWidth = 5;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = GetColor(score.id);
        ctx.fillRect(0.1*canvas.width, 0.05*place*canvas.height, canvas.width*0.8, canvas.height*0.05);
        ctx.globalAlpha = 1;
        ctx.fillStyle = colors.walls;
        ctx.strokeStyle = colors.walls;
        ctx.font = `${Math.floor(canvas.height*0.05)}px Verdana`;
        ctx.strokeRect(0.1*canvas.width, 0.05*place*canvas.height, canvas.width*0.1, canvas.height*0.05);
        ctx.fillText(place, 0.11*canvas.width, Math.round(canvas.height*0.05*place) + Math.round(0.05*canvas.height) - 3);
        ctx.strokeRect(0.2*canvas.width, 0.05*place*canvas.height, canvas.width*0.55, canvas.height*0.05);
        ctx.fillText(score.name, 0.21*canvas.width, Math.round(canvas.height*0.05*place) + Math.round(0.05*canvas.height) - 3);
        ctx.strokeRect(0.75*canvas.width, 0.05*place*canvas.height, 0.15*canvas.width, canvas.height*0.05);
        ctx.fillText(score.score, 0.76*canvas.width, Math.round(canvas.height*0.05*place) + Math.round(0.05*canvas.height) - 3);
        ctx.lineWidth = 1;
    }
    for(let i = 0; i < max; i++){
        if(scores[i]){
            DrawRow(scores[i], i+1);
        }
    }
}

function GetScores (){
    let scores = players.concat();
    for(let i = 0; i < scores.length; i++){
        if(scores[i] != null){
            scores[i].score = 0;
        }
    }
    for(let x = 0; x < DIMENSIONS; x++){
        for(let y = 0; y < DIMENSIONS; y++){
            if(map[x][y].claimant_id != null){
                let targetIndex = GetScoresIndex(scores, map[x][y].claimant_id);
                if(targetIndex != null){
                    scores[targetIndex].score++;
                }
            }
        }
    }
    scores.sort(function(a,b){
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
    return scores;
}

function GetScoresIndex (scores, targetid){
    return scores.findIndex((score) => score.id === targetid);
}

function CenterOnSpawn (map) {
    let spawnpoint = map.findIndex(tile => {
        if(tile.claimant_id == id){
            return true;
        }
    });
    tileSizeMultiplier = 1;
    view_x = map[spawnpoint].x - (Math.ceil(canvas.width / (tileSizeMultiplier*50))/2);
    view_y = map[spawnpoint].y - (Math.ceil(canvas.height / (tileSizeMultiplier*50))/2);
}

socket.onmessage = function(recieved) {
    if (recieved.data != 'error' && recieved.data != 'loss'){
        ClearMap();
        let res = JSON.parse(recieved.data);
        if(id == null){
            id = res.id;
            CenterOnSpawn(res.map);
        }
        id = res.id;
        for(let i = 0; i < res.map.length; i++){
            map[res.map[i].x][res.map[i].y] = res.map[i];
        }
        players = res.players;
        GetScores();
        DrawAll();
    } else if (recieved.data == 'loss') {
        lastScore = players[GetScoresIndex(players, id)].score;
        id = null;
        flaggedTiles = [];
        if(Game != null){
            Game();
        } else {
            alert("Somehow you lost before starting the game, please refresh the page.");
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
        menubox.style.display = "block";
        if(lastScore != null){
            let lastScoreText = document.getElementById("lastscore");
            lastScoreText.innerHTML = `You lost!  Your score was ${lastScore}`;
            lastScoreText.style.display = "block";
        }
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
    x = Math.floor(x/GetTileSize()+view_x);
    y = Math.floor(y/GetTileSize()+view_y);
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
        let step = Math.log(10*(1/tileSizeMultiplier));
        if(event.key == 'Tab'){
            event.preventDefault();
            showScoreboard = true;
            DrawAll();
        } else if (event.key == 'w' || event.key == "ArrowUp") {
            view_y -= step;
            DrawAll();
        } else if (event.key == 's' || event.key == "ArrowDown") {
            view_y += step;
            DrawAll();
        } else if (event.key == 'a' || event.key == "ArrowLeft") {
            view_x -= step;
            DrawAll();
        } else if (event.key == 'd' || event.key == "ArrowRight") {
            view_x += step;
            DrawAll();
        }
    }
}, false);

window.addEventListener("wheel", event => {
    if(id != null){
        if(event.deltaY > 0 && tileSizeMultiplier < 10){
            let tile = GetSelectedTile(event);
            tileSizeMultiplier += 0.1;
            ZoomWithAnchor(tile[0], tile[1], event);
        } else if (event.deltaY < 0 && tileSizeMultiplier > 0.1) {
            let tile = GetSelectedTile(event);
            tileSizeMultiplier -= 0.1;
            ZoomWithAnchor(tile[0], tile[1], event);
        }
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