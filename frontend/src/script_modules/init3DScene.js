import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GUI} from 'three/addons/libs/lil-gui.module.min.js';
import {BokehShader, BokehDepthShader} from 'three/addons/shaders/BokehShader2.js';

let scene, camera, renderer, controls, stats, ambientLight;
let gameOver = false;
let materialDepth, positionPlayer;
let effectController;
let inAnimate = null;
let distance = 0;

const postprocessing = { enabled: true };
const shaderSettings = {
    rings: 3,
    samples: 4
};

stats = new Stats()
document.body.appendChild(stats.dom)

init3DScene();
animate();

function init3DScene () {

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

    const depthShader = BokehDepthShader;

    materialDepth = new THREE.ShaderMaterial({
        uniforms: depthShader.uniforms,
        vertexShader: depthShader.vertexShader,
        fragmentShader: depthShader.fragmentShader
    });

    materialDepth.uniforms['mNear'].value = camera.near;
    materialDepth.uniforms['mFar'].value = camera.far;

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
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // POSTPROCESSING
    initPostprocessing();

    effectController = {
        enabled: false,
        jsDepthCalculation: true,
        shaderFocus: false,

        fstop: 2.2,
        maxblur: 1.0,

        showFocus: false,
        focalDepth: 2.8,
        manualdof: false,
        vignetting: false,
        depthblur: false,

        threshold: 0.5,
        gain: 2.0,
        bias: 0.5,
        fringe: 0.7,

        focalLength: 35,
        noise: true,
        pentagon: false,

        dithering: 0.0001

    };

    const matChanger = function () {
        for (const e in effectController) {
            if (e in postprocessing.bokeh_uniforms) {
                postprocessing.bokeh_uniforms[e].value = effectController[e];
            }
        }
        postprocessing.enabled = effectController.enabled;
        postprocessing.bokeh_uniforms['znear'].value = camera.near;
        postprocessing.bokeh_uniforms['zfar'].value = camera.far;
        camera.setFocalLength(effectController.focalLength);
    };

    const gui = new GUI();

    gui.add(effectController, 'enabled').onChange(matChanger);
    gui.add(effectController, 'jsDepthCalculation').onChange(matChanger);
    gui.add(effectController, 'shaderFocus').onChange(matChanger);
    gui.add(effectController, 'focalDepth', 0.0, 200.0).listen().onChange(matChanger);

    gui.add(effectController, 'fstop', 0.1, 22, 0.001).onChange(matChanger);
    gui.add(effectController, 'maxblur', 0.0, 5.0, 0.025).onChange(matChanger);

    gui.add(effectController, 'showFocus').onChange(matChanger);
    gui.add(effectController, 'manualdof').onChange(matChanger);
    gui.add(effectController, 'vignetting').onChange(matChanger);

    gui.add(effectController, 'depthblur').onChange(matChanger);

    gui.add(effectController, 'threshold', 0, 1, 0.001).onChange(matChanger);
    gui.add(effectController, 'gain', 0, 100, 0.001).onChange(matChanger);
    gui.add(effectController, 'bias', 0, 3, 0.001).onChange(matChanger);
    gui.add(effectController, 'fringe', 0, 5, 0.001).onChange(matChanger);

    gui.add(effectController, 'focalLength', 16, 80, 0.001).onChange(matChanger);

    gui.add(effectController, 'noise').onChange(matChanger);

    gui.add(effectController, 'dithering', 0, 0.001, 0.0001).onChange(matChanger);

    gui.add(effectController, 'pentagon').onChange(matChanger);

    gui.add(shaderSettings, 'rings', 1, 8).step(1).onChange(shaderUpdate);
    gui.add(shaderSettings, 'samples', 1, 13).step(1).onChange(shaderUpdate);

    matChanger();

    window.addEventListener('resize', windowResize, false);
}

function enablePostprocessing () {
    postprocessing.enabled = true;
}

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

    postprocessing.rtTextureDepth.setSize(window.innerWidth, window.innerHeight);
    postprocessing.rtTextureColor.setSize(window.innerWidth, window.innerHeight);
    postprocessing.bokeh_uniforms['textureWidth'].value = window.innerWidth;
    postprocessing.bokeh_uniforms['textureHeight'].value = window.innerHeight;

    renderer.setSize(size.width, size.height);
}

function initPostprocessing () {
    postprocessing.scene = new THREE.Scene();

    postprocessing.camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -10000, 10000);
    postprocessing.camera.position.z = 100;

    postprocessing.scene.add(postprocessing.camera);

    postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { type: THREE.HalfFloatType });
    postprocessing.rtTextureColor = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { type: THREE.HalfFloatType });

    const bokeh_shader = BokehShader;

    postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone(bokeh_shader.uniforms);

    postprocessing.bokeh_uniforms['tColor'].value = postprocessing.rtTextureColor.texture;
    postprocessing.bokeh_uniforms['tDepth'].value = postprocessing.rtTextureDepth.texture;
    postprocessing.bokeh_uniforms['textureWidth'].value = window.innerWidth;
    postprocessing.bokeh_uniforms['textureHeight'].value = window.innerHeight;
    // focus au centre de l'écran
    postprocessing.bokeh_uniforms['focusCoords'].value.set(0.5, 0.5);

    postprocessing.materialBokeh = new THREE.ShaderMaterial({
        uniforms: postprocessing.bokeh_uniforms,
        vertexShader: bokeh_shader.vertexShader,
        fragmentShader: bokeh_shader.fragmentShader,
        defines: {
            RINGS: shaderSettings.rings,
            SAMPLES: shaderSettings.samples
        }
    });

    postprocessing.quad = new THREE.Mesh(new THREE.PlaneGeometry(window.innerWidth, window.innerHeight), postprocessing.materialBokeh);
    postprocessing.quad.position.z = -500;
    postprocessing.scene.add(postprocessing.quad);
}

function shaderUpdate () {
    postprocessing.materialBokeh.defines.RINGS = shaderSettings.rings;
    postprocessing.materialBokeh.defines.SAMPLES = shaderSettings.samples;
    postprocessing.materialBokeh.needsUpdate = true;
}

function setInAnimate (animate) {
    inAnimate = animate;
}

function animate () {
    if (inAnimate) {
        inAnimate();
    }

    render();

    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    stats.update();
    requestAnimationFrame(animate, renderer.domElement);
}

function linearize (depth) {
    const zfar = camera.far;
    const znear = camera.near;
    return -zfar * znear / (depth * (zfar - znear) - zfar);
}

function smoothstep (near, far, depth) {
    const x = saturate((depth - near) / (far - near));
    return x * x * (3 - 2 * x);
}

function saturate (x) {
    return Math.max(0, Math.min(1, x));
}

function setChildrenPlayer (player) {
    positionPlayer = player;
}

function render () {
    camera.updateMatrixWorld();

    if (effectController.jsDepthCalculation && positionPlayer) {
        const targetDistance = positionPlayer.distanceTo(camera.position);
        distance += (targetDistance - distance) * 0.03;

        const sdistance = smoothstep(camera.near, camera.far, distance);
        console.log(sdistance);
        const ldistance = linearize(1 - sdistance);

        postprocessing.bokeh_uniforms['focalDepth'].value = ldistance;
        effectController['focalDepth'] = ldistance;
    }

    if (postprocessing.enabled && positionPlayer) {
        renderer.clear();

        // render scene into texture
        renderer.setRenderTarget(postprocessing.rtTextureColor);
        renderer.clear();
        renderer.render(scene, camera);

        // render depth into texture
        scene.overrideMaterial = materialDepth;
        renderer.setRenderTarget(postprocessing.rtTextureDepth);
        renderer.clear();
        renderer.render(scene, camera);
        scene.overrideMaterial = null;

        // render bokeh composite
        renderer.setRenderTarget(null);
        renderer.render(postprocessing.scene, postprocessing.camera);

    } else {
        scene.overrideMaterial = null;

        renderer.setRenderTarget(null);
        renderer.clear();
        renderer.render(scene, camera);
    }
}

export {scene, camera, renderer, controls, stats, changeWindowResize, ambientLight, setChildrenPlayer, setInAnimate, enablePostprocessing};
