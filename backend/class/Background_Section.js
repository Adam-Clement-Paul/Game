import {Tile} from './Background_Tile.js';

export class Section {
    constructor (widthX, lengthY, number_of_fires, chance_to_have_obstacle, chance_to_have_tree,  origin = { x: 0, y: 0 }, isSpawn = false) {
        this.widthX = widthX;
        this.lengthY = lengthY;
        this.number_of_fires = number_of_fires;
        this.origin = origin;

        if (!isSpawn) {
            // Constants
            this.chance_to_have_obstacle = chance_to_have_obstacle;
            this.chance_to_have_tree = chance_to_have_tree;
        } else {
            this.chance_to_have_obstacle = 0;
            this.chance_to_have_tree = 0;
        }

        this.tiles = [];
        this.initSection();
    }

    initSection () {
        const type = ['grass', 'tree', 'obstacle', 'border'];
        let selectedType = 0;

        for (let x = this.origin.x; x < this.origin.x + this.widthX; x++) {
            for (let y = this.origin.y; y < this.origin.y + this.lengthY; y++) {
                // All tiles at the border are border tiles
                if (
                    x === this.origin.x ||
                    x === this.origin.x + this.widthX - 1 ||
                    y === this.origin.y ||
                    y === this.origin.y + this.lengthY - 1
                ) {
                    // Borders
                    selectedType = 3;
                } else if (
                    (x === this.origin.x + 1 || x === this.origin.x + this.widthX - 2) &&
                    (y >= this.origin.y + 1 && y <= this.origin.y + this.lengthY - 2)
                ) {
                    // Trees on the sides
                    selectedType = 1;
                } else if (
                    (y === this.origin.y + 1 || y === this.origin.y + this.lengthY - 2) &&
                    (x >= this.origin.x + 1 && x <= this.origin.x + this.widthX - 2)
                ) {
                    // Trees on the top and bottom
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

                this.tiles.push(new Tile(x, y, 0, type[selectedType]));
            }
        }

        this.generateFires(this.tiles);
    }

    generateFires (tiles) {
        let fireCount = 0;
        const startX = this.origin.x;
        const startY = this.origin.y;
        const endX = this.origin.x + this.widthX;
        const endY = this.origin.y + this.lengthY;

        while (fireCount < this.number_of_fires) {
            const x = Math.floor(Math.random() * (endX - startX - 2)) + startX + 1;
            const y = Math.floor(Math.random() * (endY - startY - 2)) + startY + 1;
            const tileIndex = (x - startX) * this.widthX + (y - startY);

            const tile = tiles[tileIndex];

            if (tile && tile.fire === 0 && tile.type === 'tree') {
                tile.setFire();
                fireCount++;
            }
        }
    }

    display () {
        console.log(this.tiles);
    }
}
