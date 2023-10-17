import {Tile} from "./Tile.js";

export class Board {
    constructor(width, length) {
        this.width = width;
        this.length = length;
        this.cases = this.initPlateau();
    }

    initPlateau () {
        const models = ["tree.glb", "stone.glb", "grass.glb"];
        const tiles = [];

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.length; y++) {
                const fire = Math.random() < 0.5;
                const border = Math.random() < 0.5;
                const model = models[Math.floor(Math.random() * models.length)];

                const newTile = new Tile(x, y, fire, border, model);
                tiles.push(newTile);
            }
        }

        return tiles;
    }

    display () {
        console.log(this.cases);
    }
}