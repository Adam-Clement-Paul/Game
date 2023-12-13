import * as THREE from 'three';
import {scene, camera} from '../script_modules/init3DScene.js';
import gsap from 'gsap';
import * as UTILS from '../script_modules/utils.js';

export class Player {
    constructor (name, x, y, color, game, socket, id, active = false) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.color = new THREE.Color(color);
        this.game = game;
        // Used to send messages to the server (websocket)
        this.socket = socket;
        this.id = id;
        this.active = active;

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

        this.cube = null;
    }

    init () {
        this.cube = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.3, 0.3),
            new THREE.MeshStandardMaterial({
                color: this.color
            })
        );
        this.cube.position.set(this.x, this.cube.geometry.parameters.height / 2, this.y);
        this.cube.rotation.y = Math.PI;
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

    activePlayer () {
        this.active = true;
        document.addEventListener('keydown', this.onDocumentKeyDown.bind(this), false);
        document.addEventListener('keyup', this.onDocumentKeyUp.bind(this), false);
        document.addEventListener('click', this.onDocumentClickExtinguishFire.bind(this), false);
        document.addEventListener('contextmenu', this.onDocumentRightClick.bind(this), false);
        this.update();
        this.sendPosition();
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
        return false;
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

    // Updates the camera position and lookAt
    cameraMovements (x, y) {
        let tl = gsap.timeline();
        tl.to(camera.position, {
            duration: 0.1,
            x: x,
            y: 3,
            z: y - 2
        });
        camera.lookAt(x, 0, y);
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
        let targetRotation = this.cube.rotation.y;

        targetRotation = this.changeTargetRotation(targetRotation);

        const currentRotationDegrees = UTILS.radiansToDegrees(this.cube.rotation.y);
        const targetRotationDegrees = UTILS.radiansToDegrees(targetRotation);

        let angleDiff = ((targetRotationDegrees - currentRotationDegrees) + 180) % 360 - 180;
        if (angleDiff < -180) angleDiff += 360;

        this.cube.rotation.y += UTILS.degreesToRadians(angleDiff) * 0.1;
        if (this.cube.rotation.y > Math.PI) this.cube.rotation.y -= Math.PI * 2;
        if (this.cube.rotation.y < -Math.PI) this.cube.rotation.y += Math.PI * 2;
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
            this.velocity.set(this.speed * Math.sin(this.cube.rotation.y), this.speed * Math.cos(this.cube.rotation.y));
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
        this.rotationWithInertia();

        this.movementsWithInertia();

        this.cameraMovements(this.x, this.y);

        this.timer = setTimeout(this.update.bind(this), 1000 / 80);
        // clearTimeout(this.timer);
    }

    sendPosition () {
        this.socket.send(JSON.stringify({
            type: 'move',
            player: this.id,
            x: this.x,
            y: this.y,
            rotation: this.cube.rotation.y,
        }));

        this.timer2 = setTimeout(this.sendPosition.bind(this), 1000 / 60);
    }

    updatePosition (x, y, rotation) {
        this.x = x;
        this.y = y;
        let tl = gsap.timeline();
        tl.to(this.cube.position, {
            duration: 0.1,
            ease: 'none',
            x: x,
            y: this.cube.geometry.parameters.height / 2,
            z: y
        });
        // this.cube.position.set(this.x, this.cube.geometry.parameters.height / 2, this.y);
        this.cube.rotation.y = rotation;
    }

    remove () {
        scene.remove(this.cube);
    }
}
