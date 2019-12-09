const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

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

var scale = 1;

const Tile = {
    flagged: false,
    claimant_color: colors.ground,
    clicked: false,
    

}

function Game () {

}