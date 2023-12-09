import {Board} from "./Board.js";
import {Player} from "./Player.js";

export class Game {
    constructor (board, players, socket) {
        this.board = new Board(board);
        this.playersBackend = players;
        this.players = [];
        this.socket = socket;

        // Pour tous les joueurs impairs
        this.playersBackend.forEach(player => {
            this.addPlayer(player.name, player.x, player.y, player.color);
        });
        if (this.players.length > 0) {
            this.players[this.players.length - 1].activePlayer();
        }

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

    addPlayer (name, x, y, color) {
        this.players.push(new Player(name, x, y, color, this, this.socket));
    }

    removePlayer (name) {
        const player = this.players.filter(player => player.name === name);
        if (player.length > 0) {
            player.forEach(player => {
                player.remove();
            });
        }
        this.players = this.players.filter(player => player.name !== name);
    }

    updatePlayers (playersData) {
        const keys = Object.keys(playersData);

        for (let i = 0; i < keys.length; i++) {
            let player = playersData[keys[i]];
            let playerToUpdate = this.players[i];

            if (playerToUpdate && !playerToUpdate.active) {
                playerToUpdate.updatePosition(player.x, player.y, player.rotation);
            }
        }
    }
}
