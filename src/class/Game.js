import {Board} from "./Board.js";

export class Game {
    constructor(players, width, length) {
        this.players = players;
        this.board = new Board(width, length);
    }

    start() {
        for (let i = 0; i < this.players.length; i++) {
            console.log(`Joueur ${i + 1} : ${this.players[i].name}`);
        }
        this.board.display();
    }
}