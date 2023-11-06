import * as THREE from 'three';
import {scene} from '../script_modules/init.js';

export class Tile {
    constructor (x, y, fire = 0, type = "grass") {
        this.x = x;
        this.y = y;
        this.fire = fire;
        this.type = type;

        // Value in seconds of the time between each increase of the value of this.fire
        this.growing_fire_timer = 1;
        this.timer = 0;
        clearTimeout(this.timer);

        // Miliseconds before a tree is burnt
        this.time_before_burnt = 10000 + 20000 * Math.random();

        if (this.type === "tree") {
            this.life = 5;
        }

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
        if (this.type === "tree") {
            this.plane.material.color.setHex(0x00ff00);
        }
        if (this.type === "obstacle") {
            this.plane.material.color.setHex(0x999999);
        }
        if (this.type === "border") {
            this.plane.material.color.setHex(0x000000);
        }
        if (this.type === "grass") {
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

    setFire () {
        // Fire is initialized between 1% and 60%
        this.fire = 0.01 + 0.6 * Math.random();
        this.updateDisplay();
    }

    extinguishFire () {
        this.fire = 0;
        this.updateDisplay();
    }

    destroyTree () {
        this.life--;
        // Change the color of the tree and make it lighter
        this.plane.material.color.setHex(0x00ff00 - (0x00ff00 * (5 - this.life) / 5));

        if (this.life <= 1) {
            // The color becomes darker and darker
            this.type = "grass";
            this.updateDisplay();
        }
    }

    growingFire () {
        if (this.fire > 0 && this.fire < 1) {
            this.timer = setTimeout(() => {
                if (this.fire !== 0) {
                    this.fire += 0.01;
                    this.updateDisplay();
                    this.growingFire();
                }
                if (this.fire >= 1) {
                    this.burntTree();
                }
            }, this.growing_fire_timer * 1000 * Math.random());
        }
    }

    burntTree () {
        let burntTimer = setTimeout(() => {
            this.fire = 0;
            this.type = "grass";
            this.updateDisplay();
        }, this.time_before_burnt);
    }
}
