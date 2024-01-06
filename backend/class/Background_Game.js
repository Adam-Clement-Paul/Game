import {Board} from './Background_Board.js';
import {Player} from './Background_Player.js';

export class Game {
    static MAX_DURATION = 300;
    constructor () {
        this.board = new Board(3, 1);
        this.players = [];
        this.startedAt = null;
        this.isGameOver = false;
    }

    start (server, id) {
        this.startedAt = Date.now();
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
        this.board.fireContamination(server, id);

        // Start the game loop
        this.timeGameLoop = 0;
        this.gameLoop(server, id);
    }

    // Check if the game is over
    gameLoop (server, id) {
        if (this.isGameOver) {
            clearTimeout(this.timeGameLoop);
        }
        if (this.endOfTheGame() && !this.isGameOver) {
            clearTimeout(this.timeGameLoop);
            console.log('Game won !');
            this.gameOver(server, id, 'gameWon');
        } else {
            // console.log(this.board.tiles.filter(tile => tile.fire > 0).length);
            if (Date.now() - this.startedAt > Game.MAX_DURATION * 1000 && !this.isGameOver) {
                this.isGameOver = true;
                clearTimeout(this.timeGameLoop);
                console.log('Failed game !');
                this.gameOver(server, id, 'gameLost');
            }
            if (!this.isGameOver) {
                this.timeGameLoop = setTimeout(() => this.gameLoop(server, id), 2000);
            }
        }
    }

    getBoard () {
        return this.board;
    }

    endOfTheGame () {
        // Check each second if the game board still has fire
        if (this.board.tiles.some(tile => tile.fire > 0)) {
            return false;
        }
        // If not, the game is over
        return true;
    }

    // Send the game data (firePoints, cutTrees) to the players
    gameOver (server, id, type) {
        clearTimeout(this.board.timer);
        // Create an array of arrays with the playerID, the number of fires extinguished and the number of trees cut
        const playerData = this.players.map(player => [player.id, player.firePoints, player.cutTrees]);
        const data = {
            type: type,
            time: Date.now() - this.startedAt,
            playersData: playerData
        };
        server.publish(id, JSON.stringify(data));
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
