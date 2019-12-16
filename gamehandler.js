const DIMENSIONS = 1000;
const BOMBS_PER_TILE = 0.2;
var Tile = {
    claimant_id: null,
    count: null
}

function MapGen(){
    var map = [];
    for(let x; x < DIMENSIONS; x++){
        map.push([]);
        for(let y; y < DIMENSIONS; y++){
            map[x].push(Object.assign({x: x, y: y}, Tile));
            if(Math.random() < BOMBS_PER_TILE){
                map[x][y].count = 'bomb';
            }
        }
    }

    for(let x; x < DIMENSIONS; x++){
        for(let y; y < DIMENSIONS; y++){
            map = UpdateCount(map, x, y);
        }
    }
    return map;
}

function Regen( map, x, y){
    
}

function UpdateCount( map, x, y ) {
    if(map[x][y].count != 'bomb') {
        let count = 0;
        for(subx = -1; subx <= 1; subx++) {
            if((x+subx) >= 0 && (x+subx) < DIMENSIONS {
                for(suby = -1; suby <= 1; suby++) {
                    if((y+suby) >= 0 && (y+suby) < DIMENSIONS) {
                        if(map[x+subx][y+suby] == 'bomb') {
                            count += 1;
                        }
                    }
                }
            }
        }
        map[x][y].count = count;
    }
    return map;
}

function DeletePlayer( map, id ) {
    for(let x; x < DIMENSIONS; x++){
        for(let y; y < DIMENSIONS; y++){
            if(map[x][y].claimant_id == id){
                map[x][y].claimant_id = null;
            }
        }
    }
}

module.exports = {
    MapGen,
    UpdateCount,
    DeletePlayer
};