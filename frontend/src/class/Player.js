import * as THREE from "three";
import {scene, camera} from '../script_modules/init.js';
import gsap from "gsap";
import * as UTILS from "../script_modules/utils.js";

export class Player {
    constructor (name, x = 4, y = 3, color, game, active = false) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.color = color;
        this.game = game;

        // These values are constants
        this.speed = 0.04;
        this.friction_factor = 0.85;
        this.min_velocity = 0.0001;
        this.distance_to_collision = 0.6;

        // These values change over time
        this.velocity = new THREE.Vector2(0, 0);
        this.angularVelocity = 0;

        this.collisionWithTiles = false;

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

        if (active) {
            document.addEventListener('keydown', this.onDocumentKeyDown.bind(this), false);
            document.addEventListener('keyup', this.onDocumentKeyUp.bind(this), false);
            document.addEventListener('click', this.onDocumentClickExtinguishFire.bind(this), false);
            document.addEventListener('contextmenu', this.onDocumentRightClick.bind(this), false);

            this.update();
        }
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

    onDocumentClickExtinguishFire () {
        // TODO: Use backend token to check if the player is allowed to extinguish fire
        socket.send(JSON.stringify({
            type: "extinguish",
            player: this.name,
        }));
    }

    // Axe
    onDocumentRightClick (event) {
        event.preventDefault();
        // TODO: Use backend token to check if the player is allowed to use the axe
        socket.send(JSON.stringify({
            type: "axe",
            player: this.name,
        }));
    }

    // Check if the player is colliding with a tile of a type other than "grass" at the position of the player
    checkCollisionWithTiles (x, y) {
        for (const tile of this.game.board.tiles) {
            if (tile.type !== "grass" &&
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
        // Focus on the player
        camera.focus = 1000;
    }

    update() {
        this.cameraMovements(this.x, this.y);

        if (document.hasFocus() === false) {
            this.keys = {
                z: false,
                s: false,
                q: false,
                d: false,
            };
        }

        // TODO: Use backend token to check if the player is allowed to move
        if (Object.values(this.keys).some(key => key)) {
            socket.send(JSON.stringify({
                type: "move",
                player: this.name,
                keys: this.keys,
            }));
        }

        setTimeout(() => {
            this.update();
        }, 1000 / 30); // 30 FPS
    }
}
