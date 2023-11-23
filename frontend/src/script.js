import * as THREE from 'three';
import {gsap} from 'gsap';

import {loadModel} from './script_modules/glbImport.js';
import {camera, controls, renderer, scene, stats} from './script_modules/init.js';
import * as UTILS from "./script_modules/utils.js";

import {Game} from "./class/Game.js";
import {Player} from "./class/Player.js";

// Récupération de la partie ici
const gameId = window.location.pathname.split("/")[1];

fetch(`/${gameId}`, {
    method: 'GET',
    headers: {
        'Content-Type': 'text/html',
    }
})
    .then(response => {
        // Utilisez le contenu HTML pour afficher la page

        // Effectuez ensuite une deuxième requête pour obtenir les données du jeu
        return fetch(`/api/gameData/${gameId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    })
    .then(response => response.json())
    .then(data => {
        const game = new Game(data.game.board, data.game.players);
        console.log(data.game);
        game.setPlayer('John', 4, 3, true);
        console.log(game);
        // Effectuez vos opérations avec les données du jeu
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
