import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GUI} from 'three/addons/libs/lil-gui.module.min.js';
import {Vector2} from "three";

let scene, camera, renderer, controls, stats;

stats = new Stats()
document.body.appendChild(stats.dom)


// SCÈNE
scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);


let size = {
    width: window.innerWidth,
    height: window.innerHeight,
}

// CAMERA
camera = new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 80) // 0.1 - 20 / 10 - 80

const canvas = document.querySelector('#webgl');
canvas.style.left = 0;

// RENDERER
renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvas,
    alpha: true
});
renderer.setSize(size.width, size.height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

/*
controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
*/


// LIGHTS
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 10, 5);
directionalLight.target.position.set(0, 0, -20)
scene.add(directionalLight);

let gameOver = false;

function changeWindowResize () {
    gameOver = true;
}

function windowResize () {
    let size = {
        width: window.innerWidth,
        height: window.innerHeight,
    }

    if (gameOver) {
        size.width = window.innerWidth * 0.67;
    }
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
}

window.addEventListener('resize', windowResize, false);

export {scene, camera, renderer, controls, stats, changeWindowResize};
