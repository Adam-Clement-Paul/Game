import {Section} from "./Section.js";
import {Corridor} from "./Corridor.js";
import {Tile} from "./Tile.js";

export class Board {
    constructor (number_of_sections, number_of_fires) {
        this.number_of_sections = number_of_sections;
        this.number_of_fires = number_of_fires;
        this.tiles = [];

        this.spawn = { w: 9, l: 7 };

        this.initSections();
    }


    initSections () {
        let sections = [];
        // Spawn
        this.addSection(
            new Section(this.spawn.w, this.spawn.l, 0, {
                x: 0,
                y: 0,
            }, true),
            sections
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
                    }),
                    sections
                );
            }
        }

        this.setCorridors(sections);

        this.fillBorders();
    }

    // Return the tile at the given position
    getTileAtPosition (x, y) {
        return this.tiles.find(tile => tile.x === x && tile.y === y);
    }

    addSection (section, sections) {
        this.tiles = this.tiles.concat(section.tiles);
        // Find the center tile of the section and mark it
        sections.push(this.searchCenterOfASection(section));
    }

    searchCenterOfASection (section) {
        // Calculate the coordinates of the center tile
        const centerX = section.origin.x + Math.floor(section.widthX / 2);
        const centerY = section.origin.y + Math.floor(section.lengthY / 2);

        // Find the center tile in the tiles array
        const centerTile = section.tiles.find(tile => tile.x === centerX && tile.y === centerY);

        if (centerTile) {
            centerTile.center = true;
        }
        return section
    }

    isSectionInConflict (x, y, width, length, tiles) {
        // Check if the section is in conflict with another section
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

    setCorridors (sections) {
        // Initialize with the first section
        let findedSections = [];
        findedSections.push(sections[0]);
        const maxSections = sections.length;

        let closestSection = this.getClosestSections(findedSections[findedSections.length - 1].origin, sections, findedSections);

        let circleCorridors = true;


        // Loop until all sections are connected or no more sections can be found
        while (findedSections.length < maxSections) {
            if (Math.random() < 0.9 || sections[0] === findedSections[findedSections.length - 1]) {
                findedSections.push(closestSection[0]);
                this.setOneCorridor(findedSections[findedSections.length - 2], findedSections[findedSections.length - 1]);

                closestSection = this.getClosestSections(findedSections[findedSections.length - 1].origin, sections, findedSections);
            } else {
                closestSection = this.getClosestSections(findedSections[findedSections.length - 2].origin, sections, findedSections);
                circleCorridors = false;
            }
        }

        // Link the last section to the first one
        if (circleCorridors) {
            closestSection = this.getClosestSections(findedSections[findedSections.length - 1].origin, sections, findedSections, false);
            this.setOneCorridor(findedSections[findedSections.length - 1], closestSection[3]);
        }
    }


    // Find the closest sections to the given origin
    getClosestSections (origin, sections, findedSections, useFindedSections = true) {
        const closestSections = [];
        const foundSections = new Set();

        let currentOrigin = origin;

        while (true) {
            // Find the section at the current origin
            const sectionOrigin = sections.find(section => section.origin.x === currentOrigin.x && section.origin.y === currentOrigin.y);

            // If no section is found at the current origin, break the loop
            if (!sectionOrigin) {
                break;
            }

            // Find the center tile of the current section
            const centerTile = sectionOrigin.tiles.find(tile => tile.center === true);

            // Filter out sections that have already been found or have been marked as 'findedSections'
            const otherSections = sections.filter(section => {
                if (!useFindedSections) {
                    return section !== sectionOrigin && !foundSections.has(section);
                }
                return section !== sectionOrigin && !foundSections.has(section) && !findedSections.includes(section);
            });

            // If there are no other unexplored sections, break the loop
            if (otherSections.length === 0) {
                break;
            }

            // Calculate distances from the center tile of the current section to the centers of other sections
            const distances = otherSections.map(section => {
                const otherCenterTile = section.tiles.find(tile => tile.center === true);
                const dx = otherCenterTile.x - centerTile.x;
                const dy = otherCenterTile.y - centerTile.y;
                return Math.sqrt(dx * dx + dy * dy);
            });

            // Find the section with the minimum distance
            const minDistance = Math.min(...distances);
            const closestSection = otherSections.find((section, index) => {
                return distances[index] === minDistance;
            });

            if (closestSection) {
                closestSections.push(closestSection); // Add the closest section to the list
                foundSections.add(closestSection); // Mark the closest section as found
                currentOrigin = closestSection.origin; // Update the current origin to the closest section's origin
            } else {
                break; // If no closest section is found, break the loop
            }
        }

        return closestSections; // Return the list of closest sections
    }

    setOneCorridor (startSection, finishSection) {
        const startCenterTile = startSection.tiles.find(tile => tile.center === true);
        const finishCenterTile = finishSection.tiles.find(tile => tile.center === true);

        // Get the coordinates of the two centers
        let x0 = startCenterTile.x;
        let y0 = startCenterTile.y;
        let x1 = finishCenterTile.x;
        let y1 = finishCenterTile.y;

        // Define the desired gap
        const gapStart = 1;
        const gapEnd = 1;

        // Adjust the coordinates of the starting point
        if (x0 < x1) x0 += gapStart;
        else x0 -= gapStart;

        if (y0 < y1) y0 += gapStart;
        else y0 -= gapStart;

        // Adjust the coordinates of the ending point
        if (x0 < x1) x1 -= gapEnd;
        else x1 += gapEnd;

        if (y0 < y1) y1 -= gapEnd;
        else y1 += gapEnd;

        // Calculate the distance between the two centers
        const dx = Math.abs(x1 - x0);
        const dy = -Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;

        // Calculate the error
        let err = dx + dy;
        let e2;

        let x = x0;
        let y = y0;

        // Implement the Bresenham algorithm
        while (true) {
            // Create a corridor
            new Corridor(2, 2, { x, y }, this.tiles);

            if (x === x1 && y === y1) {
                break;
            }

            e2 = 2 * err;

            if (e2 >= dy) {
                err += dy;
                x += sx;
            }

            if (e2 <= dx) {
                err += dx;
                y += sy;
            }
        }
    }

    fillBorders () {
        // Get the tile at the top left
        const minX = Math.min(...this.tiles.map(tile => tile.x)) - 2;
        const minY = Math.min(...this.tiles.map(tile => tile.y)) - 2;

        // Get the tile at the bottom right
        const maxX = Math.max(...this.tiles.map(tile => tile.x)) + 2;
        const maxY = Math.max(...this.tiles.map(tile => tile.y)) + 2;

        // Create the border tiles where there are no tile
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                if (!this.tiles.find(tile => tile.x === x && tile.y === y)) {
                    this.tiles.push(new Tile(x, y, 0, "border"));
                }
            }
        }
    }
}
