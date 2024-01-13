import {loadModel} from './script_modules/glbImport.js';
import {camera, controls, renderer, scene, stats} from './script_modules/init3DScene.js';
import * as UTILS from './script_modules/utils.js';
import {qrcode} from "./qrcode";

import {Game} from './class/Game.js';
import { checkCookie } from './checkCookie.js';
import * as THREE from "three";


// Get the game ID from the URL
const gameId = window.location.pathname.split('/')[1].toLowerCase();
const socket = connectToWebsocket(gameId);
let game;
let inGame;
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

let clock = new THREE.Clock();


animate();

function animate () {
    if (inGame === null && game) {
        game.updatePlayground();
    }

    controls.update();

    if (game && game.board && game.board.modelsLoaded) {
        const treeInstances = game.board.treeInstanceMesh;
        const instances = game.board.instances;

        instances.forEach(instance => {
            instance.updateMatrix();
            treeInstances.setMatrixAt(instances.indexOf(instance), instance.matrix);
        })
        treeInstances.instanceMatrix.needsUpdate = true;

        const delta = clock.getDelta();
        if (game.players[0].mixer) {
            game.players[0].mixer.update(delta);
        }
    }

    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    stats.update();
    requestAnimationFrame(animate);
}

async function connectToWebsocket (gameId) {
    const sessionId = await checkCookie(gameId);

    const socket = new WebSocket(`ws://${import.meta.env.VITE_HOST}:${import.meta.env.VITE_PORT_GAME}/websocket/${gameId}/${sessionId}`);
    socket.addEventListener('error', event => {
        if (event.target.readyState === WebSocket.CLOSED || event.target.readyState === WebSocket.CLOSING) {
            window.location.reload();
        }
    });

    socket.addEventListener('message', event => {
        const data = JSON.parse(event.data);
        if (data.type === 'addPlayer' && game) {
            console.log('WS: addPlayer');
            game.addPlayer(data.playerId, data.name, data.models);
        }
        if (data.type === 'updatePlayers' && game) {
            game.updatePlayers(data.players);
        }
        if (data.type === 'removePlayer' && game) {
            game.removePlayer(data.playerId);
        }
        if (data.type === 'startGame' && game) {
            game.goToGame();
        }
        if (data.type === 'updateTiles' && game) {
            game.updateBoard(data.tiles);
        }
        if (data.type === 'gameWon' && game) {
            game.gameOver(data.time, data.playersData, true);
        }
        if (data.type === 'gameLost' && game) {
            game.gameOver(data.time, data.playersData, false);
        }
    });

    getGame(socket);
    return socket;
}
