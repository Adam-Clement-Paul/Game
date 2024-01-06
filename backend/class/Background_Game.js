import {Board} from './Background_Board.js';
import {Player} from './Background_Player.js';

export class Game {
    constructor () {
        this.board = new Board(3, 1);
        this.players = [];
        this.startedAt = null; // TODO
    }

    start (server, id) {
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
        this.board.fireContamination(0, server, id);

        // Start the game loop
        this.timeGameLoop = 0;
        this.gameLoop(server, id);
    }

    gameLoop (server, id) {
        if (this.endOfTheGame()) {
            clearTimeout(this.timeGameLoop);
            // Create an array of arrays with the playerID, the number of fires extinguished and the number of trees cut
            const playerData = this.players.map(player => [player.id, player.firePoints, player.cutTrees]);
            console.log('Game won !');
            const data = {
                type: 'gameWon',
                time: Date.now() - this.startedAt,
                playersData: playerData
            };
            server.publish(id, JSON.stringify(data));
        } else {
            // console.log(this.board.tiles.filter(tile => tile.fire > 0).length);
            this.timeGameLoop = setTimeout(() => this.gameLoop(server, id), 2000);
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

    addPlayer (id, name, models) {
        if (this.startedAt !== null) {
            this.players.push(new Player(id, name, models, 4, 3, 0, this.board, 0));
        } else {
            this.players.push(new Player(id, name, models, 0, 20, 0, this.board, {x: 0, y: 0, z: 0, w:0}));
        }
    }

    removePlayer (id) {
        // TODO: use instead the id of the player
        this.players = this.players.filter(player => player.id !== id);
    }

    updatePlayer (id, x, y, z, rotation) {
        this.players.find(player => player.id === id).updateAll(x, y, z, rotation);
    }
}
