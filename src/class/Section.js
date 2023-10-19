import {Tile} from "./Tile.js";

export class Section {
    constructor (widthX, lengthY, number_of_fires, origin = { x: 0, y: 0 }) {
        this.widthX = widthX;
        this.lengthY = lengthY;
        this.number_of_fires = number_of_fires;
        this.origin = origin;

        // Constants
        this.chance_to_have_obstacle = 0.1;
        this.chance_to_have_tree = 0;

        this.tiles = [];
        this.initSection();
    }

    initSection () {
        const type = ["grass", "tree", "obstacle", "border"];
        let selectedType = 0;

        for (let x = this.origin.x; x < this.origin.x + this.widthX; x++) {
            for (let y = this.origin.y; y < this.origin.y + this.lengthY; y++) {
                // All tiles at the border are border tiles
                if (x === this.origin.x || x === this.origin.x + this.widthX - 1 || y === this.origin.y || y === this.origin.y + this.lengthY - 1) {
                    // Borders
                    selectedType = 3;
                } else if (x === this.origin.x + 1 || x === this.origin.x + this.widthX - 2 || y === this.origin.y + 1 || y === this.origin.y + this.lengthY - 2) {
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

                this.tiles.push(new Tile(x, y, false, type[selectedType]));
            }
        }

        this.generateFires(this.tiles);
    }

    generateFires (tiles) {
        let fireCount = 0;

        // If the number of generated fires is less than number_of_fires, add additional fires randomly
        while (fireCount < this.number_of_fires) {
            const x = Math.floor(Math.random() * (this.origin.x + this.widthX)) + 1; // To avoid edges
            const y = Math.floor(Math.random() * (this.origin.y + this.lengthY)) + 1; // To avoid edges
            const tileIndex = (x - this.origin.x) * this.widthX + (y - this.origin.y);

            const tile = tiles[tileIndex];

            // If the tile is not already a fire and is a tree, set it on fire
            if (tile && !tile.fire && tile.type === "tree") {
                tile.setFire();
                fireCount++;
            }
        }
    }


    display () {
        console.log(this.tiles);
    }
}
