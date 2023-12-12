import * as THREE from 'three';
import {gsap} from 'gsap';

import {loadModel} from './script_modules/glbImport.js';
import {camera, controls, renderer, scene, stats} from './script_modules/init3DScene.js';
import * as UTILS from './script_modules/utils.js';

import {Game} from './class/Game.js';
import {Playground} from './class/Playground.js';


// Get the game ID from the URL
const gameId = window.location.pathname.split('/')[1];
//const socket = connectToWebsocket(gameId);
let game, playground;

playground = new Playground();
window.playground = playground;
playground.addTruck(0, 20, 0, true);
playground.addTruck(20, 20, 0);

/*
fetch(`/${gameId}`, {
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
        if (data.game.startedAt === null) {
            playground = new Playground();
            window.playground = playground;
            playground.addTruck(0, 20, 0);
            playground.addTruck(20, 20, 0);
        } else {
            game = new Game(data.game.board, data.game.players, socket);
            // game.setPlayer('John', 4, 3, 0xff00ff, true);
        }
    })/*
    .catch(error => {
        console.error(error);
    })*/


animate();

function animate () {
    setTimeout(animate, 1000 / 120);

    playground.update();

    // controls.update();

    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    stats.update();
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

function connectToWebsocket (gameId) {
    const socket = new WebSocket(`ws://${import.meta.env.VITE_HOST}:${import.meta.env.VITE_PORT_GAME}/websocket/` + gameId);
    // TODO: Send the token to the backend to check if the player is allowed to connect to the game

    socket.addEventListener('message', event => {
        const data = JSON.parse(event.data);
        if (data.type === 'addPlayer' && game) {
            game.addPlayer(data.name, 4, 3, data.color, data.playerId);
        }
        if (data.type === 'updatePlayers' && game) {
            game.updatePlayers(data.players);
        }
        if (data.type === 'removePlayer' && game) {
            game.removePlayer(data.playerId);
        }
    });

    socket.addEventListener('error', event => {
        throw new Error('Error: cannot connect to the websocket');
    });

    return socket;
}
