import * as THREE from 'three';

import {scene} from '../script_modules/init3DScene.js';
import * as UTILS from '../script_modules/utils.js';
import {Player} from './Player';

export class Firefighter extends Player {
    constructor (id, x, y, rotation, model, game, socket, active) {
        super(id, x, 0.5, y, rotation, socket, active);
        this.id = id;
        this.x = x;
        this.y = y;
        this.z = null;
        this.rotation = Math.PI;

        this.model = new THREE.Color(model);
        this.game = game;

        // These values are constants
        this.speed = 0.04;
        this.friction_factor = 0.85;
        this.min_velocity = 0.0001;
        this.distance_to_collision = 0.6;

        // These values change over time
        this.velocity = new THREE.Vector2(0, 0);
        this.angularVelocity = 0;

        this.timer = 0;
        this.timer2 = 0;

        // Booleans to track which keys are currently pressed
        this.keys = {
            z: false,
            s: false,
            q: false,
            d: false,
        };

        this.cube = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.3, 0.3),
            new THREE.MeshStandardMaterial({
                color: this.model
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
    }

    setActive () {
        super.setActive();
        document.addEventListener('keydown', this.onDocumentKeyDown.bind(this), false);
        document.addEventListener('keyup', this.onDocumentKeyUp.bind(this), false);
        document.addEventListener('click', this.onDocumentClickExtinguishFire.bind(this), false);
        document.addEventListener('contextmenu', this.onDocumentRightClick.bind(this), false);

        this.update();
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

        this.cube.position.set(this.x, this.cube.geometry.parameters.height / 2, this.y);
    }

    update () {
        this.cube.rotation.y = this.rotation;

        this.rotationWithInertia();
        this.movementsWithInertia();

        this.cameraMovements(this.x, this.y, 1);
        this.timer = setTimeout((this.update.bind(this)), 1000 / 80);
    }

    updatePosition (x, y, z, rotation) {
        super.updatePosition(x, y, z, rotation);
        this.cube.rotation.y = this.rotation;
        this.cube.position.set(this.x, this.cube.geometry.parameters.height / 2, this.y);
    }

    remove () {
        scene.remove(this.cube);
    }
}
