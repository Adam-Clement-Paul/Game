import {camera, controls, renderer, scene, stats, loadingManager} from './script_modules/init3DScene.js';
import {qrcode} from "./qrcode";
import {Game} from './class/Game.js';
import {checkCookie} from './checkCookie.js';


// Get the game ID from the URL
const gameId = window.location.pathname.split('/')[1].toLowerCase();
const socket = connectToWebsocket(gameId);
let game, inGame;
qrcode(gameId);

async function getGame (socket) {
    await fetch(`/${gameId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        }
    })
        .then(response => {
            // Make a second request to get the game data
            return fetch(`/api/game/data/${gameId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        })
        .then(response => response.json())
        .then(data => {
            inGame = data.game.startedAt;
            game = new Game(data.game.board, data.game.players, socket, inGame !== null, data.game.owner);

            const spanGameCode = document.getElementById('gameCode');
            spanGameCode.innerHTML += gameId.toUpperCase();
        })/*
    .catch(error => {
        console.error(error);
    })*/;
}


animate();

function animate () {
    if (inGame === null && game) {
        game.updatePlayground();
    }

    // controls.update();

    if (game?.board?.modelsLoaded) {
        const treeInstances = game.board.treeInstanceMesh;
        const instances = game.board.instances;

        instances.forEach(instance => {
            instance.updateMatrix();
            treeInstances.setMatrixAt(instances.indexOf(instance), instance.matrix);
        })
        treeInstances.instanceMatrix.needsUpdate = true;

        game.players.forEach(player => {
            if (player.glbLoaded) {
                player.updateAnimation();
            }
        });

        if (game.board.modelsLoaded) {
            game.board.tiles.forEach(tile => {
                if (tile.type === 'tree' && tile.glbLoaded) {
                    tile.updateAnimation();
                }
            });
        }
    }

    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    stats.update();
    requestAnimationFrame(animate);
}

async function connectToWebsocket (gameId) {
    const sessionId = await checkCookie(gameId);
    // Initialize the WebSocket connection
    const socket = new WebSocket(`ws://${import.meta.env.VITE_HOST}/websocket/${gameId}/${sessionId}`);

    socket.onerror = () => {
        window.location.reload();
    };

    socket.onmessage = event => {
        const data = JSON.parse(event.data);

        if (game) {
            switch (data.type) {
                case 'addPlayer':
                    console.log('WS: addPlayer');
                    game.addPlayer(data.playerId, data.name, data.models);
                    break;
                case 'updatePlayers':
                    game.updatePlayers(data.players);
                    break;
                case 'removePlayer':
                    game.removePlayer(data.playerId);
                    break;
                case 'startGame':
                    game.goToGame();
                    break;
                case 'updateTiles':
                    game.board.updateBoard(data.tiles);
                    break;
                case 'extinguish':
                    game.playAnimation('Extinguish', data.playerId);
                    break;
                case 'axe':
                    game.playAnimation('Axe', data.playerId);
                    break;
                case 'gameWon':
                    game.gameOver(data.time, data.playersData, data.coins, true);
                    break;
                case 'gameLost':
                    game.gameOver(data.time, data.playersData, data.coins, false);
                    break;
            }
        }
    };

    socket.onopen = () => {
        getGame(socket);
    };
    return socket;
}

loadingManager.onStart = () => {
    document.getElementById('loaderDiv').style.display = 'flex';
}
loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    // console.log(`Loading model ${url}: ${itemsLoaded} of ${itemsTotal} loaded`);
};
loadingManager.onLoad = () => {
    document.getElementById('loaderDiv').style.display = 'none';
};
