const DIMENSIONS = 100;
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
    for(let x = 0; x < DIMENSIONS; x++){
        map.push([]);
        for(let y = 0; y < DIMENSIONS; y++){
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
    for(let x = 0; x < DIMENSIONS; x++){
        for(let y = 0; y < DIMENSIONS; y++){
            if(map[x][y].count != 'bomb') {
                let count = 0;
                for(let subx = -1; subx <= 1; subx++) {
                    if((x+subx) >= 0 && (x+subx) < DIMENSIONS) {
                        for(let suby = -1; suby <= 1; suby++) {
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
    for(let x = 0; x < DIMENSIONS; x++){
        for(let y = 0; y < DIMENSIONS; y++){
            if(map[x][y].claimant_id == id){
                map[x][y].claimant_id = null;
                if(Math.random() < BOMBS_PER_TILE){
                    map[x][y].count = 'bomb';
                }  else  {
                    map[x][y].count = null;
                }
            }
        }
    }
    map = UpdateCount(map);
    return map;
}

function ClaimNeighbors ( map, x, y, id ){
    for(let subx = -1; subx <= 1; subx++) {
        if((x+subx) >= 0 && (x+subx) < DIMENSIONS) {
            for(let suby = -1; suby <= 1; suby++) {
                if((y+suby) >= 0 && (y+suby) < DIMENSIONS) {
                    map[x+subx][y+suby].claimant_id = id;
                    //if(map[x+subx][y+suby].count == 0) {    /DEPRECATED\
                        //map = ClaimNeighbors(map, x+subx, y+suby, id);    /DEPRECATED\
                    //}    /DEPRECATED\
                }
            }
        }
    }
    return map;
}

function GetPlayersMap ( map, id ){
    let compressedMap = [];
    for(let x = 0; x < DIMENSIONS; x++){
        for(let y = 0; y < DIMENSIONS; y++){
            if(map[x][y].claimant_id != null){
                compressedMap.push(Object.assign({}, map[x][y]));
            }
        }
    }
    for(let i = 0; i < compressedMap.length; i++){
        if(id === null || compressedMap[i].claimant_id !== id){
            compressedMap[i].count = null;
        }
    }
    return compressedMap;
}

module.exports = {
    MapGen,
    DeletePlayer,
    ClaimNeighbors,
    GetPlayersMap
};