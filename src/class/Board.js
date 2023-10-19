import {Section} from "./Section.js";

export class Board {
    constructor (number_of_sections, number_of_fires) {
        this.number_of_sections = number_of_sections;
        this.number_of_fires = number_of_fires;
        this.tiles = [];

        this.initSections();
    }

    initSections () {
        for (let i = 0; i < this.number_of_sections; i++) {
            const section = new Section(6, 7, this.number_of_fires, { x: i * 5, y: i * 1 });
            this.tiles = this.tiles.concat(section.tiles);
        }
    }

    // Return the tile at the given position
    getTileAtPosition (x, y) {
        return this.tiles.find(tile => tile.x === x && tile.y === y);
    }
}