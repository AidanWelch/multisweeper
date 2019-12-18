const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const tile_size = 10;

if (window.location.href[4] == "s"){
    const socket = new WebSocket('ws' + window.location.href.substring(5));
} else {
    const socket = new WebSocket('ws' + window.location.href.substring(4));
}

const colors = {
    tile_top: '#969696',
    tile_sides: '#646464',
    flag: '#ff0000',
    ground: '#c8c8c8',
    walls: '#000000'
}

const Tile = {
    claimant_id: null,
    clicked: false,
    draw: function (ctx){
        if(flagged){
            ctx.fillStyle = colors.flag;
        }   else {
            ctx.fillStyle = this.claimant_color;
        }
        ctx.fillRect(this.x, this.y, (this.x + tile_size), (this.y + tile_size));
    }
}

function GetMap(){

}


function Game () {

}