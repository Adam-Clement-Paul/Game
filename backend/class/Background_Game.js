import {Board} from './Background_Board.js';
import {Player} from './Background_Player.js';

/**
 * Game class
 * @class Game
 * @param {Board} board - The board
 * @param {array} players - list of players
 * @param {number} startedAt - The game start time
 * @param {boolean} isGameOver - boolean to know if the game is over or not
 * @param {number} loopIsEmpty - used in server.ts in a setInterval to check if the game is over. Set here to be attached to the class.
 * @param {number} timeGameLoop - setTimout to check if the game is over
 */
export class Game {

    static MAX_DURATION = 300; // seconds
    static CHECK_GAME_LOOP = 2000; // milliseconds

    constructor () {
        this.board = new Board(3, 1);
        this.players = [];
        this.startedAt = null;
        this.isGameOver = false;
        this.loopIsEmpty = null;
        this.timeGameLoop = 0;
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

        this.gameLoop(server, id);
    }

    // Check if the game is over
    gameLoop (server, id) {
        if (this.isGameOver) {
            clearTimeout(this.timeGameLoop);
        }
        if (this.endOfTheGame() && !this.isGameOver) {
            console.log('Game won !');
            this.gameOver(server, id, 'gameWon');
        } else {
            if (Date.now() - this.startedAt > Game.MAX_DURATION * 1000 && !this.isGameOver) {
                this.isGameOver = true;
                console.log('Failed game !');
                this.gameOver(server, id, 'gameLost');
            }
            if (!this.isGameOver) {
                this.timeGameLoop = setTimeout(() => this.gameLoop(server, id), Game.CHECK_GAME_LOOP);
            }
        }
    }

    endOfTheGame () {
        // Check each second if the game board still has fire
        return !(this.board.tiles.some(tile => tile.fire > 0));
    }

    // Send the game data (firePoints, cutTrees) to the players
    gameOver (server, id, type) {
        clearTimeout(this.timeGameLoop);
        clearTimeout(this.board.timer);

        let coins = 0;
        if (type === 'gameWon') {
            coins = 100;
        }

        const scoreList = [];
        this.players.forEach(player => {
            scoreList.push({
                id: player.id,
                extinguishedFlames: player.extinguishedFlames,
                cutTrees: player.cutTrees,
                coins: coins
            });
        });

        // Send the player data to MrPortail
        fetch(`https://${process.env.IP}:1000/api/users/gameover`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'secret': process.env.SECRET
            },
            body: JSON.stringify({ players: scoreList })
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
            })
            .catch(error => {
                console.error(error);
            });

        // Create an array of arrays with the playerID, the number of fires extinguished and the number of trees cut
        const playerData = this.players.map(player => [player.id, player.extinguishedFlames, player.cutTrees]);
        const data = {
            type: type,
            time: Date.now() - this.startedAt,
            playersData: playerData,
            coins: coins
        };
        server.publish(id, JSON.stringify(data));

        this.players = [];
    }

    reset () {
        this.isGameOver = true;
        // Disable the game loop
        clearTimeout(this.timeGameLoop);
        clearInterval(this.loopIsEmpty);

        this.players = [];
        // Disable the fire growth
        this.board.tiles.forEach(tile => {
            clearTimeout(tile.timer);
            tile = null;
        });
        clearTimeout(this.board.timer);
        this.board = [];
    }

    addPlayer (id, name, models) {
        if (this.startedAt !== null) {
            this.players.push(new Player(id, name, models, 4, 3, 0, this.board, 0));
        } else {
            this.players.push(new Player(id, name, models, 0, 20, 0, this.board, { x: 0, y: 0, z: 0, w: 0 }));
        }
    }

    removePlayer (id) {
        this.players = this.players.filter(player => player.id !== id);
    }

    updatePlayer (id, x, y, z, rotation) {
        if (!this.isGameOver) {
            this.players.find(player => player.id === id).updateAll(x, y, z, rotation);
        }
    }
}
