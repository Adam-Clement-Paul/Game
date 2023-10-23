import {Tile} from "./Tile.js";

export class Corridor {
    constructor (widthX, lengthY, origin = { x: 0, y: 0 }) {
        this.widthX = widthX;
        this.lengthY = lengthY;
        this.origin = origin;

        this.tiles = [];
        this.initCorridor();
    }

    initCorridor () {
        for (let x = this.origin.x; x < this.origin.x + this.widthX; x++) {
            for (let y = this.origin.y; y < this.origin.y + this.lengthY; y++) {
                // If the tile already exists, we don't create it, we just change its type
                if (this.tiles.find(tile => tile.x === x && tile.y === y)) {
                    this.tiles.find(tile => tile.x === x && tile.y === y).type = "grass";
                    this.tiles.find(tile => tile.x === x && tile.y === y).fire = false;
                } else {
                    this.tiles.push(new Tile(x, y, false, "grass"));
                }
            }
        }
    }
}
