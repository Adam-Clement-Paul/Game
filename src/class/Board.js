import {Section} from "./Section.js";
import {Corridor} from "./Corridor.js";

export class Board {
    constructor (number_of_sections, number_of_fires) {
        this.number_of_sections = number_of_sections;
        this.number_of_fires = number_of_fires;
        this.tiles = [];

        this.initSections();
    }

    initSections () {
        // Spawn
        this.tiles = this.tiles.concat(
            new Section(9, 7, 0, { x: 0, y: 0 }, true).tiles
        );

        // Board
        for (let i = 0; i < this.number_of_sections; i++) {
            this.tiles = this.tiles.concat(
                new Section(7, 7, this.number_of_fires, { x: i * 7, y: i * 1 + 8     }).tiles
            );
        }

        // Corridor
        this.tiles = this.tiles.concat(
            new Corridor(2, 5,{ x: 2, y: 5 }).tiles
        );

        this.tiles = this.tiles.concat(
            new Corridor(5, 2,{ x: 4, y: 10 }).tiles
        );

        // Delete duplicate tiles if a grass tile is already present at the same position
        this.tiles = this.tiles.reduce((uniqueTiles, tile) => {
            const existingTile = uniqueTiles.find(
                (t) => t.x === tile.x && t.y === tile.y && t.type === "grass"
            );

            if (!existingTile) {
                uniqueTiles.push(tile);
            } else if (tile.type === "grass") {
                existingTile.type = "grass";
            }

            return uniqueTiles;
        }, []);



        console.log(this.tiles);
    }

    // Return the tile at the given position
    getTileAtPosition (x, y) {
        return this.tiles.find(tile => tile.x === x && tile.y === y);
    }
}
