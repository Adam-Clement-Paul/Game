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
                this.tiles.push(new Tile(x, y, false, "grass"));
            }
        }
    }
}