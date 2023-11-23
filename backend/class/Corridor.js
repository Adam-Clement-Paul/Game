import {Tile} from "./Tile.js";

export class Corridor {
    constructor (widthX, lengthY, origin = { x: 0, y: 0 }, tiles, chance_to_have_tree, spawn) {
        this.widthX = widthX;
        this.lengthY = lengthY;
        this.origin = origin;

        this.tiles = tiles;
        this.chance_to_have_tree = chance_to_have_tree;
        this.spawn = spawn;

        this.initCorridor();
    }

    initCorridor () {
        for (let x = this.origin.x; x < this.origin.x + this.widthX; x++) {
            for (let y = this.origin.y; y < this.origin.y + this.lengthY; y++) {
                // If the tile already exists, we don't create it, we just change its type
                if (this.tiles.find(tile => tile.x === x && tile.y === y)) {
                    let tile = this.tiles.find(tile => tile.x === x && tile.y === y)
                    tile.type = "grass";
                    tile.fire = 0;
                    // Randomize the type of the tile
                    if (Math.random() < this.chance_to_have_tree) {
                        // Check if the tile is in the spawn
                        if ( !(x >= 1 && x <= this.spawn.l && y >= 1 && y <= this.spawn.w)) {
                            tile.type = "tree";
                            tile.life = 5;
                        }
                    }
                } else {
                    this.tiles.push(new Tile(x, y, 0, "grass"));
                }
            }
        }
    }
}
