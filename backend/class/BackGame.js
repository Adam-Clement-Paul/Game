import {Board} from "./BackBoard.js";
import {Player} from "./BackPlayer.js";

export class Game {
    constructor () {
        this.board = new Board(3, 1);
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

        // Start the game loop
        this.timeGameLoop = 0;
        this.gameLoop();
    }

    gameLoop() {
        if (this.endOfTheGame()) {
            clearTimeout(this.timeGameLoop);
            console.log("Game over !");
        }
        else {
            // console.log(this.board.tiles.filter(tile => tile.fire > 0).length);
            this.timeGameLoop = setTimeout(() => this.gameLoop(), 1000);
        }
    }

    getBoard () {
        return this.board;
    }

    endOfTheGame () {
        // Check each second if the game is the board still have fire tiles
        if (this.board.tiles.some(tile => tile.fire > 0)) {
            return false;
        }
        // If not, the game is over
        return true;
    }

    setPlayer(name, x, y, active = false) {
        this.players.push(new Player(name, x, y, this, active));
    }
}
