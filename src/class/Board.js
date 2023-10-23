import {Section} from "./Section.js";
import {Corridor} from "./Corridor.js";

export class Board {
    constructor (number_of_sections, number_of_fires) {
        this.number_of_sections = number_of_sections;
        this.number_of_fires = number_of_fires;
        this.tiles = [];

        this.spawn = { w: 9, l: 7 };

        this.initSections();
    }

    initSections () {
        // Spawn
        this.tiles = this.tiles.concat(
            new Section(this.spawn.w, this.spawn.l, 0, { x: 0, y: 0 }, true).tiles
        );

        // Board
        for (let i = 0; i < this.number_of_sections; i++) {
            let isInOtherSection = true;
            let isInSpawn = true;

            let width = 0;
            let length = 0;
            let x = 0;
            let y = 0;

            let countAgainstInfiniteLoop = 0;

            while ((isInSpawn || isInOtherSection) && countAgainstInfiniteLoop < 100) {
                // Values between 6 and 10 for width and length
                width = Math.floor(Math.random() * 5) + 6;
                length = Math.floor(Math.random() * 5) + 6;

                // Values between -25 and 25 for x and y
                x = Math.floor(Math.random() * 30) - 15;
                y = Math.floor(Math.random() * 30) - 15;

                // Check if the section is not in the spawn
                const minX = Math.max(x - 1, 0);
                const minY = Math.max(y - 1, 0);
                const maxX = Math.min(x + width + 1, this.spawn.w);
                const maxY = Math.min(y + length + 1, this.spawn.l);

                isInSpawn = minX < this.spawn.w && minY < this.spawn.l && maxX >= 0 && maxY >= 0;

                isInOtherSection = this.isSectionInConflict(x, y, width, length, this.tiles);

                countAgainstInfiniteLoop++;
            }

            if (!isInSpawn && !isInOtherSection) {
                console.log(`Section ${i + 1} : ${width}x${length} at (${x}, ${y})`);
                this.addSection(
                    new Section(width, length, this.number_of_fires, {
                        x: x,
                        y: y,
                    })
                );
            }
        }


        // Corridor
        /*
        this.tiles = this.tiles.concat(
            new Corridor(2, 5,{ x: 2, y: 5 }).tiles
        );


        this.tiles = this.tiles.concat(
            new Corridor(5, 2,{ x: 4, y: 10 }).tiles
        );

        console.log(this.tiles);

        // Delete tiles at thre same position
        for (let i = 0; i < this.tiles.length; i++) {
            const tile = this.tiles[i];
            const tileAtPosition = this.getTileAtPosition(tile.x, tile.y);

            if (tileAtPosition && tileAtPosition !== tile && tile.type !== "grass") {
                this.tiles.splice(i, 1);
                i--;
                // Retire la tuile de la scène
                tile.plane.parent.remove(tile.plane);
            }
        }

        console.log(this.tiles);

        // Créez un ensemble pour suivre les coordonnées (x, y) des tuiles en double
        const seenCoordinates = new Set();

        // Itérez sur le tableau des tuiles
        for (let i = 0; i < this.tiles.length; i++) {
            const tile = this.tiles[i];
            const coordinates = `${tile.x}-${tile.y}`;

            // Si les coordonnées (x, y) sont déjà présentes, augmentez la position y de 1
            if (seenCoordinates.has(coordinates)) {
                tile.plane.position.y += 0.3;
            } else {
                // Sinon, ajoutez les coordonnées au jeu de coordonnées
                seenCoordinates.add(coordinates);
            }
        }
        */
    }

    // Return the tile at the given position
    getTileAtPosition (x, y) {
        return this.tiles.find(tile => tile.x === x && tile.y === y);
    }

    addSection (section) {
        this.tiles = this.tiles.concat(section.tiles);
    }

    isSectionInConflict (x, y, width, length, tiles) {
        for (const tile of tiles) {
            if (
                tile.x >= x && tile.x <= x + width &&
                tile.y >= y && tile.y <= y + length
            ) {
                return true;
            }
        }
        return false;
    }

}
