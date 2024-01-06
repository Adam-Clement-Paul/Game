export class Tile {
    constructor (x, y, fire = 0, type = 'grass') {
        this.x = x;
        this.y = y;
        this.fire = fire;
        this.type = type;

        // Value in seconds of the time between each increase of the value of this.fire
        this.growing_fire_timer = 1000;
        this.timer = 0;
        clearTimeout(this.timer);

        // Miliseconds before a tree is burnt
        this.time_before_burnt = 10000 + 20000 * Math.random();

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
    }

    destroyTree () {
        this.life--;

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
            }, this.growing_fire_timer * Math.random());
        }
    }
}
