import * as THREE from 'three';
import {gsap} from 'gsap';

import {loadModel} from './script_modules/glbImport.js';
import {camera, controls, renderer, scene, stats} from './script_modules/init3DScene.js';
import * as UTILS from "./script_modules/utils.js";

import {Game} from "./class/Game.js";
import {Player} from "./class/Player.js";


// Get the game ID from the URL
const gameId = window.location.pathname.split("/")[1];
const socket = connectToWebsocket(gameId);
let game;

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
        game = new Game(data.game.board, data.game.players, socket);
        // game.setPlayer('John', 4, 3, 0xff00ff, true);
    })/*
    .catch(error => {
        console.error(error);
    })*/;


animate();

function animate () {
    requestAnimationFrame(animate);
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
    const socket = new WebSocket("ws://localhost:3010/websocket/" + gameId);

    socket.addEventListener("message", event => {
        console.log("Received message:", event.data);

        const data = JSON.parse(event.data);
        if (data.type === "join") {
            game.addPlayer(data.playerId, 4, 3, data.color);
        }
    });

    socket.addEventListener("error", event => {
        throw new Error("Error: cannot connect to the websocket");
    });

    return socket;
}

