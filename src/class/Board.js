import {Section} from "./Section.js";
import {Corridor} from "./Corridor.js";

export class Board {
    constructor (number_of_sections, number_of_fires) {
        this.number_of_sections = number_of_sections;
        this.number_of_fires = number_of_fires;
        this.tiles = [];
        this.sections = [];

        this.spawn = { w: 9, l: 7 };

        this.initSections();
    }

    initSections () {
        // Spawn
        this.addSection(
            new Section(this.spawn.w, this.spawn.l, 0, {
                x: 0,
                y: 0,
            }, true)
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
        console.log(this.sections);
        this.setCorridors();
    }

    // Return the tile at the given position
    getTileAtPosition (x, y) {
        return this.tiles.find(tile => tile.x === x && tile.y === y);
    }

    addSection(section) {
        this.tiles = this.tiles.concat(section.tiles);

        this.sections.push(this.searchCenterOfASection(section));
    }

    searchCenterOfASection (section) {
        // Calculate the coordinates of the center tile
        const centerX = section.origin.x + Math.floor(section.widthX / 2);
        const centerY = section.origin.y + Math.floor(section.lengthY / 2);

        // Find the center tile in the tiles array
        const centerTile = section.tiles.find(tile => tile.x === centerX && tile.y === centerY);

        if (centerTile) {
            centerTile.center = true;
            centerTile.plane.material.color.setHex(0x0000ff);
        }
        return section
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

    setCorridors () {

    }

    getClosestSection(section) {

    }
}
