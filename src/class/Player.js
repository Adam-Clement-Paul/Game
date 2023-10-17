import * as THREE from "three";
import {scene} from '../script_modules/init.js';

export class Player {
    constructor(name, x = 0, y = 0) {
        this.name = name;
        this.x = x;
        this.y = y;

        this.cube = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.3, 0.3),
            new THREE.MeshStandardMaterial({
                color: 0xff00ff,
            })
        );
        this.cube.position.set(this.x, 0.15, this.y);
        scene.add(this.cube);

        this.update();

        document.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'ArrowUp':
                    this.moveForward();
                    break;
                case 'ArrowDown':
                    this.moveBackward();
                    break;
                case 'ArrowLeft':
                    this.rotateLeft();
                    break;
                case 'ArrowRight':
                    this.rotateRight();
                    break;
            }
        });
    }

    move (x, y) {
        this.x = x;
        this.y = y;
        this.cube.position.set(this.x, 0.15, this.y);
    }

    moveForward () {
        // Avance en fonction de l'angle du cube rotation.y pour que le joueur avance face à lui
        this.move(this.x + Math.sin(this.cube.rotation.y), this.y + Math.cos(this.cube.rotation.y));
    }

    moveBackward () {
        this.move(this.x - Math.sin(this.cube.rotation.y), this.y - Math.cos(this.cube.rotation.y));
    }

    rotateLeft () {
        this.cube.rotation.y += Math.PI / 4;
    }

    rotateRight () {
        this.cube.rotation.y -= Math.PI / 4;
    }

    getPosition () {
        return {x: this.x, y: this.y};
    }

    update () {
        scene.add(this.cube);
    }
}