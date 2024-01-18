import * as THREE from 'three';

import {scene} from '../script_modules/init3DScene.js';
import * as UTILS from '../script_modules/utils.js';
import {Player} from './Player';
import {loadModel} from "../script_modules/glbImport";

let fpsInterval, now, then, elapsed;

/**
 * Firefighter class
 * @class Firefighter
 * @param {number} id - The id of the player
 * @param {string} name - The name of the player
 * @param {number} x - The x position of the player
 * @param {number} y - The y position of the player
 * @param {number} rotation - The rotation of the player
 * @param {object} models - The models of the player
 * @param {object} game - The game
 * @param {object} socket - The socket
 * @param {boolean} active - The active state of the player
 * @param {object} speed - The speed of the player
 * @param {object} friction_factor - The friction factor of the player
 * @param {object} min_velocity - The minimum velocity of the player
 * @param {object} distance_to_collision - The distance to collision of the player
 * @param {object} velocity - The velocity of the player
 * @param {object} angularVelocity - The angular velocity of the player
 * @param {object} stop - The stop state of the player
 * @param {object} keys - The keys of the player used to move
 * @param {object} clockF - The clock of the firefighter used to animate the firefighter
 * @param {object} clockB - The clock of the backpack used to animate the backpack
 * @param {object} currentFirefighterAction - The current action of the firefighter
 * @param {object} currentBackpackAction - The current action of the backpack
 * @param {object} model - The THREE.Group() of the player that contains the firefighter and the backpack
 * @param {object} firefighterModel - The model of the firefighter
 * @param {object} backpackModel - The model of the backpack
 */

export class Firefighter extends Player {
    constructor (id, name, x, y, rotation, models, game, socket, active = false) {
        super(id, name, x, 0, y, rotation, socket, active);
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.z = null;
        this.rotation = Math.PI;

        this.models = models;

        this.game = game;

        // These values are constants
        this.speed = 0.04;
        this.friction_factor = 0.85;
        this.min_velocity = 0.0001;
        this.distance_to_collision = 0.6;

        // These values change over time
        this.velocity = new THREE.Vector2(0, 0);
        this.angularVelocity = 0;

        this.stop = false;

        // Booleans to track which keys are currently pressed
        this.keys = {
            z: false,
            s: false,
            q: false,
            d: false
        };

        this.clockF = new THREE.Clock();
        this.clockB = new THREE.Clock();
        this.currentFirefighterAction = null;
        this.currentBackpackAction = null;

        this.model = new THREE.Group();
        this.firefighterModel = null;
        this.backpackModel = null;

        this.setupModel();
    }

    setupModel () {
        this.model.position.set(this.x, 0, this.y);
        this.model.scale.set(0.15, 0.15, 0.15);

        loadModel(`https://pyrofighters.online:4040/files/${this.models['firefighter']}?type=glb`, (modelF, animationsF) => {
            this.firefighterModel = modelF;
            this.model.add(this.firefighterModel);

            loadModel(`https://pyrofighters.online:4040/files/${this.models['backpack']}?type=glb`, (modelB, animationsB) => {
                this.backpackModel = modelB;
                this.model.add(this.backpackModel);

                scene.add(this.model);

                // Promise to make sure that the two models are loaded before creating the mixers
                Promise.all([this.firefighterModel, this.backpackModel].map(model => model.onLoadPromise))
                    .then(() => {
                        this.loadAnimations(animationsF, animationsB);
                    });
            });
        });
    }

    loadAnimations(animationsF, animationsB) {
        this.firefighterMixer = new THREE.AnimationMixer(this.firefighterModel);
        this.backpackMixer = new THREE.AnimationMixer(this.backpackModel);

        const states = ['Idle', 'Walk', 'Extinguish', 'Axe'];

        this.actionsFirefighter = {};
        this.actionsBackpack = {};

        const loadAnimationPromises = [];

        for (const element of states) {
            const clipFPromise = new Promise((resolve) => {
                const clipF = animationsF.find(animation => animation && animation.name === element);
                resolve(clipF || null);
            });

            const clipBPromise = new Promise((resolve) => {
                const clipB = animationsB.find(animation => animation && animation.name === element);
                resolve(clipB || null);
            });

            loadAnimationPromises.push(
                Promise.all([clipFPromise, clipBPromise]).then(([clipF, clipB]) => {
                    if (clipF && clipB) {
                        const actionF = this.firefighterMixer.clipAction(clipF);
                        const actionB = this.backpackMixer.clipAction(clipB);

                        this.actionsFirefighter[clipF.name] = actionF;
                        this.actionsBackpack[clipB.name] = actionB;

                        if (clipF.name === 'Idle' || clipF.name === 'Walk') {
                            actionF.loop = THREE.LoopRepeat;
                            actionB.loop = THREE.LoopRepeat;

                            if (clipF.name === 'Walk') {
                                actionF.setEffectiveTimeScale(1.3);
                                actionB.setEffectiveTimeScale(1.3);
                            } else {
                                actionF.play();
                                actionB.play();
                            }
                        } else if (clipF.name === 'Extinguish' || clipF.name === 'Axe') {
                            actionF.clampWhenFinished = true;
                            actionF.loop = THREE.LoopOnce;
                            actionB.clampWhenFinished = true;
                            actionB.loop = THREE.LoopOnce;

                            if (clipF.name === 'Extinguish' || clipF.name === 'Axe') {
                                actionF.setEffectiveTimeScale(1.3);
                                actionB.setEffectiveTimeScale(1.3);
                            }
                        }
                    } else {
                        console.error(`Clip ${element} not found in animationsF or animationsB`);
                    }
                })
            );
        }

        this.firefighterMixer.addEventListener('finished', () => {
            this.fadeToAction('Idle', 0.5);
        });
        this.backpackMixer.addEventListener('finished', () => {
            this.fadeToAction('Idle', 0.5);
        });

        this.currentFirefighterAction = this.actionsBackpack['Idle'];
        this.currentBackpackAction = this.actionsFirefighter['Idle'];

        this.glbLoaded = true;

        return Promise.all(loadAnimationPromises);
    }



    fadeToAction (name, duration) {
        // For the firefighter model
        const previousFirefighterAction = this.currentFirefighterAction;
        this.currentFirefighterAction = this.actionsFirefighter[name];
        if (this.currentFirefighterAction && previousFirefighterAction && previousFirefighterAction !== this.currentFirefighterAction) {
            previousFirefighterAction.fadeOut(duration);
            this.currentFirefighterAction
                .reset()
                .setEffectiveWeight(1)
                .fadeIn(duration)
                .play();
        }

        // For the backpack model
        const previousBackpackAction = this.currentBackpackAction;
        this.currentBackpackAction = this.actionsBackpack[name];
        if (this.currentBackpackAction && previousBackpackAction && previousBackpackAction !== this.currentBackpackAction) {
            previousBackpackAction.fadeOut(duration);
            this.currentBackpackAction
                .reset()
                .setEffectiveWeight(1)
                .fadeIn(duration)
                .play();
        }
    }


    updateAnimation () {
        this.firefighterMixer.update(this.clockF.getDelta());
        this.backpackMixer.update(this.clockB.getDelta());
    }

    setActive () {
        this.active = true;
        document.addEventListener('keydown', this.onDocumentKeyDown.bind(this), false);
        document.addEventListener('keyup', this.onDocumentKeyUp.bind(this), false);
        document.addEventListener('click', this.onDocumentClickExtinguishFire.bind(this), false);
        document.addEventListener('contextmenu', this.onDocumentRightClick.bind(this), false);

        this.startUpdating(60);
        this.sendPosition('move');
    }

    onDocumentKeyDown (event) {
        if (event.key.toLowerCase() in this.keys && this.glbLoaded) {
            this.keys[event.key.toLowerCase()] = true;
            if (this.actionsFirefighter && this.actionsBackpack) {
                this.fadeToAction('Walk', 0.1);
            }
        }
    }

    onDocumentKeyUp (event) {
        if (event.key.toLowerCase() in this.keys && this.glbLoaded) {
            this.keys[event.key.toLowerCase()] = false;
        }
        if (!this.keys.z && !this.keys.s && !this.keys.q && !this.keys.d && this.glbLoaded) {
            this.fadeToAction('Idle', 0.5);
        }
    }

    // FireHose
    onDocumentClickExtinguishFire () {
        this.fadeToAction('Extinguish', 0.5);

        // Use backend token to check if the player is allowed to extinguish fire
        this.socket.send(JSON.stringify({
            type: 'extinguish',
            id: this.id,
        }));
    }

    // Axe
    onDocumentRightClick (event) {
        event.preventDefault();
        this.fadeToAction('Axe', 0);

        // Use backend token to check if the player is allowed to use the axe
        this.socket.send(JSON.stringify({
            type: 'axe',
            id: this.id,
        }));
    }

    // Check if the player is colliding with a tile of a type other than 'grass' at the position of the player
    checkCollisionWithTiles (x, y) {
        // Try to edit this code to get a banned
        for (const tile of this.game.board.tiles) {
            if (tile.type !== 'grass' &&
                Math.abs(tile.x - x) < this.distance_to_collision &&
                Math.abs(tile.y - y) < this.distance_to_collision
            ) {
                return true; // Collision with a tile, movement is forbidden.
            }
        }
        return false; // No collision with a tile, movement is allowed.
    }

    changeTargetRotation (targetRotation) {
        if (this.keys.z) targetRotation = 0;
        if (this.keys.s) targetRotation = Math.PI;
        if (this.keys.q) targetRotation = Math.PI / 2;
        if (this.keys.d) targetRotation = -Math.PI / 2;

        if (this.keys.z && this.keys.q) targetRotation = Math.PI / 4;
        if (this.keys.z && this.keys.d) targetRotation = -Math.PI / 4;
        if (this.keys.s && this.keys.q) targetRotation = Math.PI * 3 / 4;
        if (this.keys.s && this.keys.d) targetRotation = -Math.PI * 3 / 4;
        return targetRotation;
    }

    // Updates the player rotation with inertia
    rotationWithInertia () {
        let targetRotation = this.rotation;

        targetRotation = this.changeTargetRotation(targetRotation);

        const currentRotationDegrees = UTILS.radiansToDegrees(this.rotation);
        const targetRotationDegrees = UTILS.radiansToDegrees(targetRotation);

        let angleDiff = ((targetRotationDegrees - currentRotationDegrees) + 180) % 360 - 180;
        if (angleDiff < -180) angleDiff += 360;

        this.rotation += UTILS.degreesToRadians(angleDiff) * 0.1;
        if (this.rotation > Math.PI) this.rotation -= Math.PI * 2;
        if (this.rotation < -Math.PI) this.rotation += Math.PI * 2;
    }

    movementsAndCollisions () {
        if (this.velocity.x !== 0 || this.velocity.y !== 0) {
            let desiredX = this.x + this.velocity.x;
            let desiredY = this.y + this.velocity.y;

            // True: collision detected, False: no collision detected
            let collisionDetected = this.checkCollisionWithTiles(desiredX, desiredY);

            if (collisionDetected) {
                // Check if the player can move in the desired direction
                if (!this.checkCollisionWithTiles(desiredX, this.y)) {
                    this.x = desiredX;
                } else if (!this.checkCollisionWithTiles(this.x, desiredY)) {
                    this.y = desiredY;
                }
            } else {
                // If no collision is detected, move in the desired direction
                this.x += this.velocity.x;
                this.y += this.velocity.y;
            }
        }
    }

    movementsWithInertia () {
        if (this.keys.z || this.keys.s || this.keys.q || this.keys.d) {
            this.velocity.set(this.speed * Math.sin(this.rotation), this.speed * Math.cos(this.rotation));
        }

        this.movementsAndCollisions();

        // Reduce velocity and angular velocity (simulate friction)
        this.velocity.multiplyScalar(this.friction_factor);
        this.angularVelocity *= this.friction_factor;

        // Minimum velocity threshold to avoid excessive deceleration
        if (Math.abs(this.velocity.x) < this.min_velocity) this.velocity.x = 0;
        if (Math.abs(this.velocity.y) < this.min_velocity) this.velocity.y = 0;
        if (Math.abs(this.angularVelocity) < this.min_velocity) this.angularVelocity = 0;

        this.model.position.set(this.x, 0, this.y);
    }

    startUpdating (fps) {
        fpsInterval = 1000 / fps;
        then = Date.now();
        this.update();
    }

    update () {
        if (this.stop) {
            return;
        }
        requestAnimationFrame(this.update.bind(this));
        now = Date.now();
        elapsed = now - then;
        if (elapsed > fpsInterval && this.model !== null && this.mixer !== null) {
            // Get ready for next frame by setting then=now, but...
            // Also, adjust for fpsInterval not being multiple of 16.67
            then = now - (elapsed % fpsInterval);

            this.model.rotation.y = this.rotation;

            this.rotationWithInertia();
            this.movementsWithInertia();

            this.cameraMovements(this.x, this.y, 0.8);
        }
    }

    updatePosition (x, y, z, rotation) {
        super.updatePosition(x, y, z, rotation);
        this.model.rotation.y = this.rotation;
        const previousPosition = this.model.position.clone();
        this.model.position.set(this.x, 0, this.y);
        // If the player's position has changed a lot, we put the player's animation to Walk
        if (this.actionsFirefighter && this.actionsBackpack) {
            if (previousPosition.distanceTo(this.model.position) > 0.1) {
                this.fadeToAction('Walk', 0.1);
                // Else if he is currently Extinguish or Axe, we do nothing
            } else if (this.currentFirefighterAction !== this.actionsFirefighter['Extinguish'] && this.currentFirefighterAction !== this.actionsFirefighter['Axe']) {
                this.fadeToAction('Idle', 0.1);
            }
        }
    }

    remove () {
        scene.remove(this.model);
    }

    stopMoving () {
        // Add a black circle under the active player to simulate a shadow
        const shadow = new THREE.Mesh(
            new THREE.CircleGeometry(0.3, 32),
            new THREE.MeshBasicMaterial({
                color: 0x000000,
                side: THREE.DoubleSide,
            })
        );
        shadow.rotation.x = Math.PI / 2;
        shadow.position.set(this.x, 0, this.y);
        scene.add(shadow);

        this.rotation = Math.PI - Math.PI / 9;
        this.model.rotation.y = this.rotation;
        this.stop = true;
        for (const key in this.keys) {
            this.keys[key] = false;
        }

        document.removeEventListener('keydown', this.onDocumentKeyDown.bind(this), false);
        document.removeEventListener('keyup', this.onDocumentKeyUp.bind(this), false);
        document.removeEventListener('click', this.onDocumentClickExtinguishFire.bind(this), false);
        document.removeEventListener('contextmenu', this.onDocumentRightClick.bind(this), false);

        super.stopMoving();
    }
}
