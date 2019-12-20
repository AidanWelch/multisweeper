const DIMENSIONS = 1000;
const BOMBS_PER_TILE = 0.2;
class Tile {
    constructor( x, y ) {    
        this.x = x;
        this.y = y;
        this.claimant_id = null;
        this.count = null;
    }
}

function MapGen(){
    let map = [];
    for(let x; x < DIMENSIONS; x++){
        map.push([]);
        for(let y; y < DIMENSIONS; y++){
            map[x].push(new Tile(x,y));
            if(Math.random() < BOMBS_PER_TILE){
                map[x][y].count = 'bomb';
            }
        }
    }

    map = UpdateCount(map);
    return map;
}

function UpdateCount( map ) {
    for(let x; x < DIMENSIONS; x++){
        for(let y; y < DIMENSIONS; y++){
            if(map[x][y].count != 'bomb') {
                let count = 0;
                for(subx = -1; subx <= 1; subx++) {
                    if((x+subx) >= 0 && (x+subx) < DIMENSIONS) {
                        for(suby = -1; suby <= 1; suby++) {
                            if((y+suby) >= 0 && (y+suby) < DIMENSIONS) {
                                if(map[x+subx][y+suby].count == 'bomb') {
                                    count += 1;
                                }
                            }
                        }
                    }
                }
                map[x][y].count = count;
            }
        }
    }  
    return map;
}

function DeletePlayer( map, id ) {
    for(let x; x < DIMENSIONS; x++){
        for(let y; y < DIMENSIONS; y++){
            if(map[x][y].claimant_id == id){
                map[x][y].claimant_id = null;
                if(Math.random() < BOMBS_PER_TILE){
                    map[x][y].count = 'bomb';
                } else {
                    map[x][y].count = null;
                }
            }
        }
    }
    map = UpdateCount(map);
    return map;
}

function ClaimNeighbors ( map, x, y, id ){
    for(subx = -1; subx <= 1; subx++) {
        if((x+subx) >= 0 && (x+subx) < DIMENSIONS) {
            for(suby = -1; suby <= 1; suby++) {
                if((y+suby) >= 0 && (y+suby) < DIMENSIONS) {
                    if(map[x+subx][y+suby].count == 0) {
                        map[req.data.x][req.data.y].claimant_id = id;
                        ClaimNeighbors(map, req.data.x, req.data.y, id);
                    }
                }
            }
        }
    }
    return map;
}

function GetPlayersMap ( map, id ){
    for(let x; x < DIMENSIONS; x++){
        for(let y; y < DIMENSIONS; y++){
            if(map[x][y].claimant_id != id || id == null){
                map[x][y].count = null;
            }
        }
    }
    return map;
}

module.exports = {
    MapGen,
    DeletePlayer,
    ClaimNeighbors,
    GetPlayersMap 
};