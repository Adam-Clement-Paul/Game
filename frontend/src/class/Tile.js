import * as THREE from 'three';
import {scene} from '../script_modules/init3DScene.js';
import {loadModel} from "../script_modules/glbImport";

export class Tile {
    constructor (x, y, fire = 0, type = 'grass', model = null) {
        this.x = x;
        this.y = y;
        this.fire = fire;
        this.type = type;
        this.model = model;

        this.clock = new THREE.Clock();

        if (this.model) {
            loadModel('./models/tree2.glb', (modelTree, animations) => {
                this.model = modelTree;
                const scale = 0.08;
                this.model.scale.set(scale, scale, scale);
                this.model.position.set(this.x, 0, this.y);
                this.model.rotation.y = Math.random() * Math.PI;
                scene.add(this.model);

                this.mixer = new THREE.AnimationMixer(this.model);
                // Récupère l'animation "Fire3" de l'objet pour la jouer
                const fireAnim = THREE.AnimationClip.findByName(animations, 'Fire3');
                const action = this.mixer.clipAction(fireAnim);
                action.loop = THREE.LoopRepeat;
                action.play();
            });
        }

        this.plane = new THREE.Mesh(
            new THREE.PlaneGeometry(0.9, 0.9),
            new THREE.MeshStandardMaterial({
                side: THREE.DoubleSide,
            })
        );
        this.plane.rotation.x = Math.PI / 2;
        this.plane.position.set(this.x, 0, this.y);
        this.plane.receiveShadow = true;
        this.plane.castShadow = true;

        this.updateDisplay();

        scene.add(this.plane);
    }

    updateDisplay () {
        if (this.type === 'tree') {
            this.plane.material.color.setHex(0x00ff00);
        }
        if (this.type === 'obstacle') {
            this.plane.material.color.setHex(0x999999);
        }
        if (this.type === 'border') {
            this.plane.material.color.setHex(0x000000);
        }
        if (this.type === 'grass') {
            this.plane.material.color.setHex(0xffffff);
        }

        if (this.fire !== 0) {
            let yellow = new THREE.Color(0xffff00);
            let red = new THREE.Color(0xff0000);
            // Used to interpolate between yellow and red to show evolution of the fire
            let interpolatedColor = new THREE.Color();
            interpolatedColor.lerpColors(yellow, red, this.fire);

            this.plane.material.color.copy(interpolatedColor);
        }
    }

    updateAnimation () {
        if (this.mixer) {
            this.mixer.update(this.clock.getDelta());
        }
    }

    cutTree () {
        console.log('Cutting tree');
        console.log(this.model);
        this.model.visible = false;
        scene.remove(this.model);
    }

    axeStroke () {
        console.log('Axe stroke');
    }

    hide () {
        scene.remove(this.plane);
    }
}
