import {Tile} from "./Tile.js";

export class Board {
    constructor (width, length, number_of_fires) {
        this.width = width;
        this.length = length;
        this.number_of_fires = number_of_fires;

        // Constants
        this.chance_to_have_obstacle = 0.1;
        this.chance_to_have_tree = 0.2;

        this.tiles = this.initBoard();
    }

    initBoard() {
        const type = ["grass", "tree", "obstacle", "border"];
        const tiles = [];
        let selectedType = 0;

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.length; y++) {
                // All tiles at the border are border tiles
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.length - 1) {
                    // Borders
                    selectedType = 3;
                } else if (x === 1 || x === this.width - 2 || y === 1 || y === this.length - 2) {
                    // Trees
                    selectedType = 1;
                } else if (Math.random() < this.chance_to_have_obstacle) {
                    // Obstacles
                    selectedType = 2;
                } else if (Math.random() < this.chance_to_have_tree) {
                    // Trees
                    selectedType = 1;
                } else {
                    // Grass
                    selectedType = 0;
                }

                tiles.push(new Tile(x, y, false, type[selectedType]));
            }
        }

        this.generateFires(tiles);

        return tiles;
    }

    generateFires(tiles) {
        let fireCount = 0;
        // If the number of generated fires is less than number_of_fires, add additional fires randomly
        while (fireCount < this.number_of_fires) {
            const x = Math.floor(Math.random() * (this.width - 2)) + 1; // To avoid edges
            const y = Math.floor(Math.random() * (this.length - 2)) + 1; // To avoid edges

            const tileIndex = x * this.length + y;
            const tile = tiles[tileIndex];

            // If the tile is not already a fire and is a tree, set it on fire
            if (!tile.fire && tile.type === "tree") {
                tile.setFire();
                fireCount++;
            }
        }
    }

    display () {
        console.log(this.tiles);
    }

    getTileAt (x, y) {
        // If the tile is outside the board, return null
        if (x < 0 || x >= this.width || y < 0 || y >= this.length) {
            return null;
        }
        const tileIndex = x * this.length + y;
        return this.tiles[tileIndex];
    }
}
