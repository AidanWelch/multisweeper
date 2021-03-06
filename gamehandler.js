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

function UpdateScores ( map, players ){
    let win = true;
    for(let i = 0; i < players.length; i++){
        if(players[i] !== null){
            players[i].score = 0;
        }
    }
    for(let x = 0; x < DIMENSIONS; x++){
        for(let y = 0; y < DIMENSIONS; y++){
            if(map[x][y].claimant_id !== null){
                let targetIndex = players.findIndex((player) => player.id === map[x][y].claimant_id);
                if(targetIndex !== -1){
                    players[targetIndex].score++;
                }
            } else if (map[x][y].count !== 'bomb'){
                win = false;
            }
        }
    }
    return [players, win];
}

function DeletePlayer( map, id ) {
    for(let x = 0; x < DIMENSIONS; x++){
        for(let y = 0; y < DIMENSIONS; y++){
            if(map[x][y].claimant_id == id){
                map[x][y].claimant_id = null;
                /* Removed until decision on map regen is made
                if(Math.random() < BOMBS_PER_TILE){
                    map[x][y].count = 'bomb';
                }  else  {
                    map[x][y].count = null;
                }
                */
            }
        }
    }
    //map = UpdateCount(map);  //along with this
    return map;
}

function ClaimNeighbors ( map, x, y, id ){
    for(let subx = -1; subx <= 1; subx++) {
        if((x+subx) >= 0 && (x+subx) < DIMENSIONS) {
            for(let suby = -1; suby <= 1; suby++) {
                if((y+suby) >= 0 && (y+suby) < DIMENSIONS) {
                    if(map[x+subx][y+suby].claimant_id == null){
                        map[x+subx][y+suby].claimant_id = id;
                        if(map[x+subx][y+suby].count === 0){
                            map = ClaimNeighbors(map, x+subx, y+suby, id); 
                        }
                    }
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

function SpawnPlayer ( map, id ){
    let selectedTile = null;
    for(let i = 0; i < 9; i++){
        let usableTiles = [];
        for(let x = 0; x < DIMENSIONS; x++){
            for(let y = 0; y < DIMENSIONS; y++){
                if(map[x][y].count === i && map[x][y].claimant_id === null){
                    usableTiles.push(map[x][y]);
                }
            }
        }
        if (usableTiles.length != 0) {
            selectedTile = usableTiles[Math.floor(Math.random()*usableTiles.length)];
            map[selectedTile.x][selectedTile.y].claimant_id = id;
            if(map[selectedTile.x][selectedTile.y].count == 0){
                map = ClaimNeighbors(map, selectedTile.x, selectedTile.y, id);
            }
            return map;
        }
    }
}

function TileCompare ( tile1, tile2 ){
    let xbool = (tile1.x == tile2.x);
    let ybool = (tile1.y == tile2.y);
    let claimant_idbool = (tile1.claimant_id == tile2.claimant_id);
    let countbool = (tile1.count == tile2.count);
    return (xbool && ybool && claimant_idbool && countbool);
}

module.exports = {
    MapGen,
    DeletePlayer,
    ClaimNeighbors,
    GetPlayersMap,
    SpawnPlayer,
    TileCompare,
    UpdateScores,
    DIMENSIONS
};