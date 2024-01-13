import * as THREE from 'three';

import {scene} from '../script_modules/init3DScene.js';
import * as UTILS from '../script_modules/utils.js';
import {Player} from './Player';
import {loadModel} from "../script_modules/glbImport";

let fpsInterval, now, then, elapsed;

export class Firefighter extends Player {
    constructor (id, name, x, y, rotation, models, game, socket, active = false) {
        super(id, name, x, 0.5, y, rotation, socket, active);
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.z = null;
        this.rotation = Math.PI;

        this.player = new THREE.Color(models['player']);
        this.backpack = new THREE.Color(models['backpack']);
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
            d: false,
        };

        this.armature = null;
        this.mixer = null;
        this.clock = new THREE.Clock();

        this.cube = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.3, 0.3),
            new THREE.MeshStandardMaterial({
                color: this.player
            })
        );
        this.cube.position.set(this.x, this.cube.geometry.parameters.height / 2, this.y);
        scene.add(this.cube);

        const cubeOrientation = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 0.5),
            new THREE.MeshStandardMaterial({
                    color: 0xff0000
                }
            ));
        cubeOrientation.position.set(0, 0, 0.2);
        this.cube.add(cubeOrientation);
        this.cube.visible = false;

        this.setModel();
    }

    setModel() {
        let allBones = [];
        let geometries = [];
        let skeletons = [];

        loadModel('./models/groupe.glb', (model) => {
            console.log("GROUPE", model);

            // Récupère récursivement toutes les géométries du modèle dans chacun de ses enfants
            this.recursiveGetGeometries(model, geometries, skeletons);
            skeletons = skeletons[0];
            console.log("GROUP - GEOMETRIES", geometries);
            console.log("GROUP - SKELETONS", skeletons);
        });

        loadModel('./models/armature.glb', (armature, animations) => {
            armature.traverse((object) => {
                if (object.isBone) {
                    allBones.push(object);
                }
            });
            this.armature = armature;
            this.armature.position.set(this.x, 0, this.y);
            this.armature.scale.set(0.2, 0.2, 0.2);
            scene.add(this.armature);

            const personnage = armature.children.find((child) => child.name === 'Personnage');

            this.mixer = new THREE.AnimationMixer(this.armature);

            this.extinguishAnimation = animations.find((clip) => clip.name === 'Extinguish');
            this.extinguishAction = this.mixer.clipAction(this.extinguishAnimation);
            this.extinguishAction.setLoop(THREE.LoopRepeat, Infinity);
            this.extinguishAction.play();

            // Utilise THREE.SkeletonHelper pour afficher les os de l'armature
            const helper = new THREE.SkeletonHelper(this.armature);
            helper.material.linewidth = 3;
            scene.add(helper);

            // Importe le modèle Pompier et l'attache à tous les os de l'armature
            loadModel('./models/pompier.glb', (modelPompier) => {
                // modelPompier.rotation.y = Math.PI;
                this.armature.add(modelPompier);
                console.log("POMPIER", modelPompier);
            });

            // Importe le modèle Sac et l'attache à tous les os de l'armature
            loadModel('./models/sac.glb', (modelSac) => {
                //personnage.add(modelSac.children[0]);
                this.armature.add(modelSac);
                console.log("SAC", modelSac);
            });

            console.log("ARMATURE", this.armature);
        });
    }

    attachModelToAllBones(model, armature) {
        const personnage = armature.children.find((child) => child.name === 'Personnage');
        personnage.traverse((object) => {
            if (object.isBone) {
            }
        });
    }

    // Fonction qui parcours le modèle, quand il y a un children avec la propriété "geometry", on l'ajoute dans le tableau "geometries",
    // s'il n'y a pas de children, on retourne à celui d'avant et on continue la boucle
    recursiveGetGeometries(model, geometries, skeletons) {
        if (model.children.length > 0) {
            model.children.forEach((child) => {
                if (child.geometry) {
                    geometries.push(child.geometry);
                    skeletons.push(child.skeleton);
                } else {
                    this.recursiveGetGeometries(child, geometries, skeletons);
                }
            });
        }
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
        if (event.key in this.keys) {
            this.keys[event.key] = true;
        }
    }

    onDocumentKeyUp (event) {
        if (event.key in this.keys) {
            this.keys[event.key] = false;
        }
    }

    // FireHose
    onDocumentClickExtinguishFire () {
        // TODO: Use backend token to check if the player is allowed to extinguish fire
        this.socket.send(JSON.stringify({
            type: 'extinguish',
            id: this.id,
        }));
    }

    // Axe
    onDocumentRightClick (event) {
        event.preventDefault();

        // TODO: Use backend token to check if the player is allowed to use the axe
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

        this.armature.position.set(this.x, 1, this.y);
    }

    startUpdating(fps) {
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
        if (elapsed > fpsInterval && this.armature !== null && this.mixer !== null) {
            // Get ready for next frame by setting then=now, but...
            // Also, adjust for fpsInterval not being multiple of 16.67
            then = now - (elapsed % fpsInterval);

            this.armature.rotation.y = this.rotation;

            this.rotationWithInertia();
            this.movementsWithInertia();
        }
    }

    updatePosition (x, y, z, rotation) {
        super.updatePosition(x, y, z, rotation);
        this.armature.rotation.y = this.rotation;
        this.armature.position.set(this.x, this.armature.geometry.parameters.height / 2, this.y);
    }

    remove () {
        scene.remove(this.armature);
    }

    stopMoving () {
        // Ajoute un cercle noir en dessous du joueur actif pour simuler une ombre
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
        this.armature.rotation.y = this.rotation;
        this.stop = true;

        document.removeEventListener('keydown', this.onDocumentKeyDown.bind(this), false);
        document.removeEventListener('keyup', this.onDocumentKeyUp.bind(this), false);
        document.removeEventListener('click', this.onDocumentClickExtinguishFire.bind(this), false);
        document.removeEventListener('contextmenu', this.onDocumentRightClick.bind(this), false);

        super.stopMoving();
    }
}
