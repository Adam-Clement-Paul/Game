/**
 * Class Background_Tile
 * @class Background_Tile
 * @param {number} x - The x coordinate of the tile
 * @param {number} y - The y coordinate of the tile
 * @param {number} fire - The fire value of the tile
 * @param {string} type - The type of the tile
 * @param {boolean} waitHit - Boolean to know if the tile is waiting to be hit
 * @param {boolean} waitExtinction - Boolean to know if the tile is waiting to be extinguished
 * @param {number} timer - The timer to increase the value of this.fire
 * @param {number} life - The life of the tree
 */

export class Tile {

    static GROWING_FIRE_TIMER = 1000; // milliseconds

    constructor (x, y, fire = 0, type = 'grass') {
        this.x = x;
        this.y = y;
        this.fire = fire;
        this.type = type;

        this.waitHit = false;
        this.waitExtinction = false;

        this.timer = 0;
        clearTimeout(this.timer);

        if (this.type === 'tree') {
            this.life = 3;
        }
    }

    setFire () {
        // Fire is initialized between 1% and 60%
        this.fire = 0.01 + 0.6 * Math.random();
    }

    extinguishFire () {
        this.fire = 0;
        this.waitExtinction = true;
        setTimeout(() => {
            this.waitExtinction = false;
        }, 1000);
    }

    destroyTree () {
        this.life--;
        this.waitHit = true;
        setTimeout(() => {
            this.waitHit = false;
        }, 1000);

        if (this.life <= 0) {
            // The color becomes darker and darker
            this.type = 'grass';
        }
    }

    growingFire () {
        if (this.fire > 0 && this.fire < 1) {
            this.timer = setTimeout(() => {
                if (this.fire !== 0) {
                    this.fire += 0.01;
                    this.growingFire();
                }
            }, Tile.GROWING_FIRE_TIMER * Math.random());
        }
    }
}
