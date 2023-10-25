export class Collisions {
    constructor (players, board) {
        this.players = players;
        this.board = board;

        this.players.forEach(player => {
            this.updateCollisions(player);
        });
    }

    updateCollisions (player) {
        // Get the tile on which the player is standing
        const tile = this.board.getTileAtPosition(Math.round(player.x), Math.round(player.y));

        // Forbid the player to move on obstacles
        if (tile.type !== "grass") {
            player.x = player.previousX;
            player.y = player.previousY;
        }

        requestAnimationFrame(() => this.updateCollisions(player));
    }
}
