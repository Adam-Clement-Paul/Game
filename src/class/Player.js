import * as THREE from "three";
import {scene, camera} from '../script_modules/init.js';
import {Game} from "./Game.js";
import gsap from "gsap";
import * as UTILS from "../script_modules/utils.js";

export class Player {
    constructor (name, x = 4, y = 3) {
        this.name = name;
        this.x = x;
        this.y = y;

        // These values are constants
        this.speed = 0.07;
        this.angular_speed = 0.02;
        this.friction_factor = 0.85;
        this.min_velocity = 0.0001;
        this.backward_factor = 0.5;

        // These values change over time
        this.velocity = new THREE.Vector2(0, 0);
        this.angularVelocity = 0;

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
                color: 0xff00ff
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

        document.addEventListener('keydown', this.onDocumentKeyDown.bind(this), false);
        document.addEventListener('keyup', this.onDocumentKeyUp.bind(this), false);

        document.addEventListener('click', this.onDocumentClick.bind(this), false);

        this.update();
    }

    setGame (game) {
        this.game = game;
    }

    onDocumentKeyDown (event) {
        this.keys[event.key] = true;
    }

    onDocumentKeyUp (event) {
        this.keys[event.key] = false;
    }

    onDocumentClick () {
        // Get the direction of the player
        let playerDirection = this.cube.rotation.y;

        // Get the tile on which the player is standing
        const tile = this.game.getBoard().getTileAtPosition(Math.round(this.x), Math.round(this.y));
        if (!tile) {
            return;
        }

        // Get the tile in front of the player
        const offsetX = Math.round(Math.sin(playerDirection));
        const offsetY = Math.round(Math.cos(playerDirection));

        const frontTile = this.game.getBoard().getTileAtPosition(tile.x + offsetX, tile.y + offsetY);
        if (!frontTile) {
            return;
        }

        /*
        // Get the 4 tiles around the front tile
        const adjacentTiles = [
            frontTile,
            this.game.getBoard().getTileAt(frontTile.x + 1, frontTile.y),
            this.game.getBoard().getTileAt(frontTile.x - 1, frontTile.y),
            this.game.getBoard().getTileAt(frontTile.x, frontTile.y + 1),
            this.game.getBoard().getTileAt(frontTile.x, frontTile.y - 1),
        ];
        */

        const adjacentTiles = [frontTile];

        if (offsetX !== 0 && offsetY !== 0) {
            // Get the 2 tiles on the sides of the front tile, like an L
            adjacentTiles.push(this.game.getBoard().getTileAtPosition(tile.x + offsetX, tile.y));
            adjacentTiles.push(this.game.getBoard().getTileAtPosition(tile.x, tile.y + offsetY));
        } else if (offsetX === 0) {
            // Get the 2 tiles on the Z / -Z sides of the player, like a T
            adjacentTiles.push(this.game.getBoard().getTileAtPosition(tile.x + offsetX - 1, tile.y + offsetY));
            adjacentTiles.push(this.game.getBoard().getTileAtPosition(tile.x + offsetX + 1, tile.y + offsetY));
        } else if (offsetY === 0) {
            // Get the 2 tiles on the X / -X sides of the player, like a T
            adjacentTiles.push(this.game.getBoard().getTileAtPosition(tile.x + offsetX, tile.y + offsetY - 1));
            adjacentTiles.push(this.game.getBoard().getTileAtPosition(tile.x + offsetX, tile.y + offsetY + 1));
        }

        // For each tile, extinguish the fire
        adjacentTiles.forEach(tile => {
            if (tile) {
                tile.extinguishFire();
            }
        });
    }

    // Updates the position and state of the player
    move (x, y) {
        this.x = x;
        this.y = y;
        this.cube.position.set(this.x, this.cube.geometry.parameters.height / 2, this.y);
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

    update () {
        let targetRotation = this.cube.rotation.y;

        targetRotation = this.changeTargetRotation(targetRotation);

        // Convert rotation angles to degrees
        const currentRotationDegrees = UTILS.radiansToDegrees(this.cube.rotation.y);
        const targetRotationDegrees = UTILS.radiansToDegrees(targetRotation);

        // Calculate the shortest difference in angles
        let angleDiff = ((targetRotationDegrees - currentRotationDegrees) + 180) % 360 - 180;
        if (angleDiff < -180) angleDiff += 360;

        // Interpolate between current rotation and target rotation for smoother movement
        this.cube.rotation.y += UTILS.degreesToRadians(angleDiff) * 0.1;

        // Calculate velocity based on accumulated rotation
        if (this.keys.z || this.keys.s || this.keys.q || this.keys.d) {
            this.velocity.set(this.speed * Math.sin(this.cube.rotation.y), this.speed * Math.cos(this.cube.rotation.y));
        }

        // Update position based on velocity
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Update rotation based on angular velocity
        this.cube.rotation.y += this.angularVelocity;

        // Reduce velocity and angular velocity (simulate friction)
        this.velocity.multiplyScalar(this.friction_factor);
        this.angularVelocity *= this.friction_factor;

        // Minimum velocity threshold to avoid excessive deceleration
        if (Math.abs(this.velocity.x) < this.min_velocity) this.velocity.x = 0;
        if (Math.abs(this.velocity.y) < this.min_velocity) this.velocity.y = 0;
        if (Math.abs(this.angularVelocity) < this.min_velocity) this.angularVelocity = 0;

        this.move(this.x, this.y);

        this.cameraMovements(this.x, this.y);

        // Request the next animation frame for continuous update
        requestAnimationFrame(this.update.bind(this));
    }
}
