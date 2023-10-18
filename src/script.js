import * as THREE from 'three';
import {gsap} from 'gsap';

import {loadModel} from './script_modules/glbImport.js';
import {camera, controls, renderer, scene, stats} from './script_modules/init.js';
import * as UTILS from "./script_modules/utils.js";

import {Player} from "./class/Player.js";
import {Game} from "./class/Game.js";

const player = new Player('John');
const game = new Game([player], 10, 10, 5);
game.start();

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
