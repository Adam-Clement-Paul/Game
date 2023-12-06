import {Board} from "./Board.js";
import {Player} from "./Player.js";

export class Game {
    constructor (board, players, socket) {
        this.board = new Board(board);
        this.players = players;
        this.socket = socket;

        this.board.displayTiles();
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

        // Start the game loop
        this.timeGameLoop = 0;
        this.gameLoop();
    }

    getBoard () {
        return this.board;
    }

    setPlayer(name, x, y, color, active = false) {
        this.players.push(new Player(name, x, y, color, this, this.socket, active));
    }
}
