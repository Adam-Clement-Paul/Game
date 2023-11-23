import {Section} from "./Section.js";
import {Corridor} from "./Corridor.js";
import {Tile} from "./Tile.js";

/*
* Board class
* number_of_sections: number of sections in the board [need to be greater than 2]
 */
export class Board {
    constructor (board) {
        this.board = board;
        this.tiles = board.tiles;

        this.displayTiles();
    }


    displayTiles () {
        this.tiles.forEach(tile => {
            new Tile(tile.x, tile.y, tile.fire, tile.type);
        });
    }

    // Return the tile at the given position
    getTileAtPosition (x, y) {
        return this.tiles.find(tile => tile.x === x && tile.y === y);
    }

    // Recursive function to generate fires
    fireContamination (timer) {
        clearTimeout(timer);
        // Each second, if a fire tile have fire to 1, it will contaminate the adjacent tiles
        this.tiles.forEach(tile => {
            if (tile.fire > 1) {
                const adjacentTiles = [];

                // Get the 4 adjacent tiles
                adjacentTiles.push(this.getTileAtPosition(tile.x - 1, tile.y));
                adjacentTiles.push(this.getTileAtPosition(tile.x + 1, tile.y));
                adjacentTiles.push(this.getTileAtPosition(tile.x, tile.y - 1));
                adjacentTiles.push(this.getTileAtPosition(tile.x, tile.y + 1));

                // For each tile, if it's a tree, set it on fire
                adjacentTiles.forEach(tile => {
                    if (tile && tile.type === "tree" && tile.fire === 0) {
                        tile.setFire();
                        tile.growingFire();
                    }
                });
            }
        });
        // Loop every second with timer
        timer = setTimeout(() => {
            this.fireContamination(timer);
        }, 2000);
    }
}
