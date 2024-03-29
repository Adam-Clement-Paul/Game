import * as THREE from 'three';
import {scene} from '../script_modules/init3DScene.js';
import {loadModel} from "../script_modules/glbImport";

/**
 * Tile class
 * @class Tile
 * @param {number} x - The tile x position
 * @param {number} y - The tile y position
 * @param {number} fire - The tile fire value
 * @param {string} type - The tile type
 * @param {object} model - The tile model
 * @param {object} plane - The tile plane
 * @param {object} clock - The tile clock
 * @param {object} treeMixer - The tile treeMixer
 * @param {object} actions - The tile actions
 * @param {object} currentAction - The tile currentAction
 * @param {boolean} glbLoaded - Boolean to know if the glb is loaded or not
 * @param {number} timer - The timer to set the fire
 *
 */

export class Tile {

    static EVOLUTION_FIRE_TIME = 3000; // milliseconds

    constructor (x, y, fire = 0, type = 'grass', model = null) {
        this.x = x;
        this.y = y;
        this.fire = fire;
        this.type = type;
        this.model = model;

        this.clock = new THREE.Clock();

        if (this.model) {
            loadModel('./models/tree.glb', (modelTree, animations) => {
                this.model = modelTree;
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        if (child.material.name === 'RedFire') {
                            child.material.depthWrite = false;
                        }
                    }
                });

                const scale = 0.08;
                this.model.scale.set(scale, scale, scale);
                this.model.position.set(this.x, 0, this.y);
                this.model.rotation.y = Math.random() * Math.PI;
                scene.add(this.model);

                this.loadAnimations(animations);

                if (this.fire !== 0) {
                    this.setFire(this.fire);
                }
            });
        }

        if (this.type === 'tree') {
            this.life = 3;
        }

        this.plane = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.MeshStandardMaterial({
                side: THREE.DoubleSide,
            })
        );
        this.plane.rotation.x = Math.PI / 2;
        this.plane.position.set(this.x, 0, this.y);
        this.plane.receiveShadow = true;
        this.plane.castShadow = true;

        this.timer = 0;

        this.updateDisplay();

        scene.add(this.plane);
    }

    updateDisplay () {
        if (this.type === 'tree') {
            this.plane.material.color.setHex(0x6ea84c);
        }
        if (this.type === 'obstacle') {
            this.plane.material.color.setHex(0x658c4f);
        }
        if (this.type === 'border') {
            this.plane.material.color.setHex(0x4f8231);
        }
        if (this.type === 'grass') {
            this.plane.material.color.setHex(0x66a343);
        }
        if (this.fire !== 0) {
            this.plane.material.color.setHex(0xff0000);
        }
    }

    loadAnimations (animations) {
        this.treeMixer = new THREE.AnimationMixer(this.model);
        const states = ['Idle', 'Hit', 'Fall', 'Fire1', 'Fire2', 'Fire3'];

        this.actions = {};
        for (let i = 0; i < animations.length; i++) {
            const clip = animations.find(animation => animation.name === states[i]);
            const action = this.treeMixer.clipAction(clip);
            if (states.indexOf(clip.name) !== -1) {
                this.actions[clip.name] = action;
            }
            if (this.actions[clip.name]) {
                // Si l'animation est "Fire1", on la joue en boucle
                if (clip.name === 'Fire1' || clip.name === 'Fire2' || clip.name === 'Fire3') {
                    action.loop = THREE.LoopRepeat;
                } else {
                    action.clampWhenFinished = true;
                    action.loop = THREE.LoopOnce;
                }
            }
        }

        this.currentAction = this.actions['Idle'];
        this.glbLoaded = true;
    }

    fadeToAction (name, duration) {
        // For the tree model
        const previousAction = this.currentAction;
        this.currentAction = this.actions[name];
        if (previousAction && previousAction !== this.currentAction) {
            previousAction.fadeOut(duration);
        }
        if (this.currentAction) {
            this.currentAction
                .reset()
                .setEffectiveTimeScale(1)
                .setEffectiveWeight(1)
                .fadeIn(duration)
                .play();
        }
    }

    updateAnimation () {
        if (this.treeMixer) {
            this.treeMixer.update(this.clock.getDelta());
        }
    }

    cutTree () {
        this.fadeToAction('Fall', 0);
        setTimeout(() => {
            this.model.visible = false;
            scene.remove(this.model);
            this.type = 'grass';
            this.updateDisplay();
        }, this.actions['Fall']._clip.duration * 1000);
    }

    axeStroke () {
        this.fadeToAction('Hit', 0);
        this.life--;
    }

    hide () {
        scene.remove(this.plane);
        if (this.model) {
            scene.remove(this.model);
        }
    }

    setFire (fire) {
        this.fire = fire;
        if (fire === 0) {
            clearTimeout(this.timer);
            this.fadeToAction('Idle', 0);
        } else {
            this.timer = setTimeout(() => {
                this.fadeToAction('Fire1', 0.5);
                this.timer = setTimeout(() => {
                    this.fadeToAction('Fire2', 0.5);
                    this.timer = setTimeout(() => {
                        this.fadeToAction('Fire3', 0.5);
                    }, Tile.EVOLUTION_FIRE_TIME);
                }, Tile.EVOLUTION_FIRE_TIME);
            }, Tile.EVOLUTION_FIRE_TIME);
        }
    }
}
