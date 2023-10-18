import * as THREE from "three";
import {scene} from '../script_modules/init.js';

export class Player {
    constructor (name, x = 0, y = 0) {
        this.name = name;
        this.x = x;
        this.y = y;

        this.velocity = new THREE.Vector2(0, 0);
        this.angularVelocity = 0;
        this.speed = 0.04; // Adjust the speed of the player

        this.cube = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.3, 0.3),
            new THREE.MeshStandardMaterial({
                color: 0xff00ff,
            })
        );
        this.cube.position.set(this.x, 0.15, this.y);
        scene.add(this.cube);

        // Booleans to track which keys are currently pressed
        this.keys = {
            z: false,
            s: false,
            q: false,
            d: false,
        };

        this.update();

        document.addEventListener('keydown', this.onDocumentKeyDown.bind(this), false);
        document.addEventListener('keyup', this.onDocumentKeyUp.bind(this), false);
    }

    onDocumentKeyDown (event) {
        this.keys[event.key] = true;
    }

    onDocumentKeyUp (event) {
        this.keys[event.key] = false;
    }

    // Updates the position and state of the player
    move (x, y) {
        this.x = x;
        this.y = y;
        this.cube.position.set(this.x, 0.15, this.y);
    }

    update () {
        // Check which keys are currently pressed and adjust velocities accordingly
        if (this.keys.z) {
            this.velocity.set(this.speed * Math.sin(this.cube.rotation.y), this.speed * Math.cos(this.cube.rotation.y));
        }
        if (this.keys.s) {
            this.velocity.set(-this.speed / 2 * Math.sin(this.cube.rotation.y), -this.speed / 2 * Math.cos(this.cube.rotation.y));
        }
        if (this.keys.q) {
            this.angularVelocity = 0.05;
        }
        if (this.keys.d) {
            this.angularVelocity = -0.05;
        }

        // Update position based on velocity
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Update rotation based on angular velocity
        this.cube.rotation.y += this.angularVelocity;

        // Reduce velocity and angular velocity (simulate friction)
        this.velocity.multiplyScalar(0.8);
        this.angularVelocity *= 0.8;

        // Add a minimum velocity threshold to avoid excessive deceleration
        const minVelocity = 0.0001;
        if (Math.abs(this.velocity.x) < minVelocity) this.velocity.x = 0;
        if (Math.abs(this.velocity.y) < minVelocity) this.velocity.y = 0;
        if (Math.abs(this.angularVelocity) < minVelocity) this.angularVelocity = 0;

        // Update the position of the cube in the scene
        this.move(this.x, this.y);

        // Request the next animation frame for continuous update
        requestAnimationFrame(this.update.bind(this));
    }
}
