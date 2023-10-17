export class Tile {
    constructor(x, y, fire = false, border = false, model = null) {
        this.x = x;
        this.y = y;
        this.fire = fire;
        this.border = border;
        this.model = model;
    }
}