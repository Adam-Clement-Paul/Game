import {loadModel} from './script_modules/glbImport.js';
import {camera, controls, renderer, scene, stats} from './script_modules/init3DScene.js';
import * as UTILS from './script_modules/utils.js';
import {qrcode} from "./qrcode";

import {Game} from './class/Game.js';
import { checkCookie } from './checkCookie.js';


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


animate();

function animate () {
    if (inGame === null && game) {
        game.updatePlayground();
    }

    // controls.update();

    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    stats.update();
    requestAnimationFrame(animate);
}

function windowResize () {
    let size = {
        width: window.innerWidth,
        height: window.innerHeight,
    }
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
}

window.addEventListener('resize', windowResize, false);

async function connectToWebsocket (gameId) {
    const sessionId = await checkCookie(gameId);
    const socket = new WebSocket(`ws://${import.meta.env.VITE_HOST}:${import.meta.env.VITE_PORT_GAME}/websocket/${gameId}/${sessionId}`);
    // TODO: Send the token to the backend to check if the player is allowed to connect to the game

    socket.addEventListener('message', event => {
        const data = JSON.parse(event.data);
        if (data.type === 'addPlayer' && game) {
            console.log('WS: addPlayer');
            game.addPlayer(data.playerId, data.name, data.color);
        }
        if (data.type === 'updatePlayers' && game) {
            game.updatePlayers(data.players);
        }
        if (data.type === 'removePlayer' && game) {
            game.removePlayer(data.playerId);
        }
        if (data.type === 'startGame' && game) {
            game.goToGame(data.players);
        }
    });

    socket.addEventListener('error', event => {
        throw new Error('Error: cannot connect to the websocket');
    });

    getGame(socket);
    return socket;
}
