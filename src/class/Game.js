import {Section} from "./Section.js";
import {Board} from "./Board.js";

export class Game {
    constructor (players, number_of_sections, number_of_fires) {
        this.board = new Board(number_of_sections, number_of_fires);
        this.players = players;

        this.players.forEach(player => {
            player.setGame(this);
        });
    }

    start () {
        for (let i = 0; i < this.players.length; i++) {
            console.log(`Player ${i + 1} : ${this.players[i].name}`);
        }
    }

    getBoard () {
        return this.board;
    }
}
