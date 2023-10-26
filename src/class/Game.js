import {Board} from "./Board.js";
import {Player} from "./Player.js";

export class Game {
    constructor () {
        this.board = new Board(10, 5);
        this.players = [
            new Player('John', 4, 3, this, true),
            new Player('Jane', 4, 4, this)
        ];
    }

    start () {
        for (let i = 0; i < this.players.length; i++) {
            console.log(`Player ${i + 1} : ${this.players[i].name}`);
        }
    }

    getBoard () {
        return this.board;
    }

    getPlayers () {
        return this.players;
    }
}
