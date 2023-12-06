import * as THREE from 'three';
import {gsap} from 'gsap';

import {loadModel} from './script_modules/glbImport.js';
import {camera, controls, renderer, scene, stats} from './script_modules/init.js';
import * as UTILS from "./script_modules/utils.js";

import {Game} from "./class/Game.js";
import {Player} from "./class/Player.js";

// Get the game ID from the URL
const gameId = window.location.pathname.split("/")[1];

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
        const game = new Game(data.game.board, data.game.players);
        console.log(data.game.players);
        //game.setPlayer('John', 4, 3, 0xff00ff, true);




    })/*
    .catch(error => {
        console.error(error);
    })*/;


// Forbid right click
document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
});

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
