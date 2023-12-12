import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GUI} from 'three/addons/libs/lil-gui.module.min.js';

let scene, camera, renderer, controls, stats;

stats = new Stats()
document.body.appendChild(stats.dom)


// SCÈNE
scene = new THREE.Scene();

let size = {
    width: window.innerWidth,
    height: window.innerHeight,
}

// CAMERA
camera = new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 70); // 20

const canvas = document.querySelector('#webgl');

// RENDERER
renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvas
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

export {scene, camera, renderer, controls, stats};
