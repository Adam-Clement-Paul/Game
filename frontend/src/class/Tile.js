import * as THREE from 'three';
import {scene} from '../script_modules/init3DScene.js';

export class Tile {
    constructor (x, y, fire = 0, type = 'grass') {
        this.x = x;
        this.y = y;
        this.fire = fire;
        this.type = type;

        this.plane = new THREE.Mesh(
            new THREE.PlaneGeometry(0.9, 0.9),
            new THREE.MeshStandardMaterial({
                side: THREE.DoubleSide,
            })
        );
        this.plane.rotation.x = Math.PI / 2;
        this.plane.position.set(this.x, 0, this.y);

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
}
