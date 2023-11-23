export class Player {
    constructor (name, x = 4, y = 3, game, active = false) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.game = game;
    }

    getPosition () {
        return { x: this.x, y: this.y };
    }

    setPosition (x, y) {
        this.x = x;
        this.y = y;
    }


    // Check if the player is colliding with a tile of a type other than "grass" at the position of the player
    checkCollisionWithTiles (x, y) {
        for (const tile of this.game.board.tiles) {
            if (tile.type !== "grass" &&
                Math.abs(tile.x - x) < this.distance_to_collision &&
                Math.abs(tile.y - y) < this.distance_to_collision
            ) {
                return true; // Collision with a tile, movement is forbidden.
            }
        }
        return false; // No collision with a tile, movement is allowed.
    }
}
