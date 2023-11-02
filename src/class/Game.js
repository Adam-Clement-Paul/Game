import {Board} from "./Board.js";
import {Player} from "./Player.js";

export class Game {
    constructor () {
        this.board = new Board(10, 5);
        this.players = [];
    }

    start () {
        for (let i = 0; i < this.players.length; i++) {
            console.log(`Player ${i + 1} : ${this.players[i].name}`);
        }

        // Activate the fire growth
        this.board.tiles.forEach(tile => {
            if (tile.fire !== 0) {
                tile.growingFire();
            }
        });
        // Activate the contamination
        this.board.fireContamination(0);
    }

    getBoard () {
        return this.board;
    }

    setPlayer(name, x, y, active = false) {
        this.players.push(new Player(name, x, y, this, active));
    }
}
