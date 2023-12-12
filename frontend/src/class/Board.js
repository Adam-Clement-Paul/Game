import {Tile} from './Tile.js';

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
}
