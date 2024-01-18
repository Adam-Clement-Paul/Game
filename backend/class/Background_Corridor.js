import {Tile} from './Background_Tile.js';

/**
 * Corridor class
 * @class Corridor
 * @param {number} widthX - The width of the corridor
 * @param {number} lengthY - The length of the corridor
 * @param {array} tiles - Board tiles to update
 * @param {number} chance_to_have_tree - The chance to have a tree on a tile
 * @param {object} spawn - Spawn size to check whether the tile is in the spawn and not create a tree on it
 * @param {object} origin - The origin of the corridor
 */
export class Corridor {
    constructor (widthX, lengthY, tiles, chance_to_have_tree, spawn, origin = { x: 0, y: 0 }) {
        this.widthX = widthX;
        this.lengthY = lengthY;

        this.tiles = tiles;
        this.chance_to_have_tree = chance_to_have_tree;
        this.spawn = spawn;
        this.origin = origin;

        this.initCorridor();
    }

    initCorridor () {
        for (let x = this.origin.x; x < this.origin.x + this.widthX; x++) {
            for (let y = this.origin.y; y < this.origin.y + this.lengthY; y++) {
                // If the tile already exists, we don't create it, we just change its type
                if (this.tiles.find(tile => tile.x === x && tile.y === y)) {
                    let tile = this.tiles.find(tile => tile.x === x && tile.y === y)
                    tile.type = 'grass';
                    tile.fire = 0;
                    // Randomize the type of the tile
                    if (Math.random() < this.chance_to_have_tree) {
                        // Check if the tile is in the spawn
                        if (!(x >= 1 && x <= this.spawn.l && y >= 1 && y <= this.spawn.w)) {
                            tile.type = 'tree';
                            tile.life = 3;
                        }
                    }
                } else {
                    this.tiles.push(new Tile(x, y, 0, 'grass'));
                }
            }
        }
    }
}
