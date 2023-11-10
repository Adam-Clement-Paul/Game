import * as THREE from 'three';
import {gsap} from 'gsap';

import {loadModel} from './script_modules/glbImport.js';
import {camera, controls, renderer, scene, stats} from './script_modules/init.js';
import * as UTILS from "./script_modules/utils.js";

import {Game} from "./class/Game.js";
import {Player} from "./class/Player.js";


const game = new Game();
game.setPlayer('John', 4, 3, true);
game.start();

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