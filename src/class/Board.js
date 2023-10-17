import {Tile} from "./Tile.js";

export class Board {
    constructor (width, length, number_of_fires) {
        this.width = width;
        this.length = length;
        this.number_of_fires = number_of_fires;
        this.cases = this.initBoard();
    }

    initBoard () {
        // Tree / Grass / Obstacle / Border
        const type = ["grass", "tree", "obstacle", "border"];
        const tiles = [];
        let selectedType = 0;
        let fireCount = 0;

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.length; y++) {
                // All tiles at the border are border tiles
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.length - 1) {
                    selectedType = 3;
                } else if (x === 1 || x === this.width - 2 || y === 1 || y === this.length - 2) {
                    selectedType = 1;
                } else {
                    // There is 0.1 chance to have an obstacle, 0.2 to have a tree, 0.6 to have grass
                    selectedType = Math.random() < 0.1 ? 2 : Math.random() < 0.2 ? 1 : 0;
                }

                if (selectedType === 1 && fireCount < this.number_of_fires && Math.random() < 0.1) {
                    tiles.push(new Tile(x, y, true, type[1]));
                    fireCount++;
                } else {
                    tiles.push(new Tile(x, y, false, type[selectedType]));
                }
            }
        }

        // If the number of generated fires is less than number_of_fires, add additional fires randomly
        while (fireCount < this.number_of_fires) {
            const x = Math.floor(Math.random() * (this.width - 2)) + 1; // Pour éviter les bords
            const y = Math.floor(Math.random() * (this.length - 2)) + 1; // Pour éviter les bords

            // If the tile is not already a fire, set it on fire
            if (!tiles[x * this.length + y].fire) {
                tiles[x * this.length + y].setFire();
                fireCount++;
            }
        }

        return tiles;
    }

    display () {
        console.log(this.cases);
    }
}
