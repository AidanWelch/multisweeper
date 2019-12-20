const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const TILE_SIZE = 10;
const socket = new WebSocket('ws' + window.location.href.slice(4, -1) + ':81');
if (window.location.href[4] == "s"){
    const socket = new WebSocket('ws' + window.location.href.slice(5, -1) + ':81');
} else {
    const socket = new WebSocket('ws' + window.location.href.slice(4, -1) + ':81');
}

const colors = {
    tile_top: '#969696',
    tile_sides: '#646464',
    flag: '#ff0000',
    ground: '#c8c8c8',
    walls: '#000000'
}

class Request {
    constructor (operation, data){
        this.operation = operation;
        this.data = data;
    }
}

function GetColor(id){
    id.toString();
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

function Draw(tile) {
    if(tile.claimant_id == null){
        ctx.fillStyle = colors.tile_top;
    }   else {
        ctx.fillStyle = GetColor(tile.claimant_id);
    }
    ctx.fillRect(tile.x, tile.y, (tile.x + TILE_SIZE), (tile.y + TILE_SIZE));
}


socket.onmessage = function(recieved) {
    let res = JSON.parse(recieved.data);
    for(let x; x < res.map.length; x++){
        for(let y; y < res.map.length; y++){
            Draw(res.map[x][y]);
            console.log(res.map[x][y])
        }
    }
    console.log(recieved);
}

socket.onopen = function(e){
    function Game () {
        socket.send(JSON.stringify(new Request('create', {name: 'test'})));
    }
    console.log("open");
    Game();
}