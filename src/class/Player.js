import * as THREE from "three";
import { scene } from '../script_modules/init.js';

export class Player {
    constructor(name, x = 0, y = 0) {
        this.name = name;
        this.x = x;
        this.y = y;

        this.velocity = new THREE.Vector2(0, 0);
        this.angularVelocity = 0;
        this.speed = 0.075;

        this.cube = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.3, 0.3),
            new THREE.MeshStandardMaterial({
                color: 0xff00ff,
            })
        );
        this.cube.position.set(this.x, 0.15, this.y);
        scene.add(this.cube);

        // Booléens pour suivre quelles touches sont actuellement enfoncées
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
        };

        this.update();

        document.addEventListener('keydown', this.onDocumentKeyDown.bind(this), false);
        document.addEventListener('keyup', this.onDocumentKeyUp.bind(this), false);
    }

    onDocumentKeyDown(event) {
        this.keys[event.key] = true;

        switch (event.key) {
            case 'ArrowUp':
                this.velocity.set(this.speed * Math.sin(this.cube.rotation.y), this.speed * Math.cos(this.cube.rotation.y));
                break;
            case 'ArrowDown':
                this.velocity.set(-this.speed * Math.sin(this.cube.rotation.y), -this.speed * Math.cos(this.cube.rotation.y));
                break;
            case 'ArrowLeft':
                this.angularVelocity = 0.05;
                break;
            case 'ArrowRight':
                this.angularVelocity = -0.05;
                break;
        }
    }

    onDocumentKeyUp(event) {
        this.keys[event.key] = false;

        // Réinitialiser la vélocité associée à la touche relâchée
        switch (event.key) {
            case 'ArrowUp':
            case 'ArrowDown':
                this.velocity.set(0, 0);
                break;
            case 'ArrowLeft':
            case 'ArrowRight':
                this.angularVelocity = 0;
                break;
        }
    }

    move(x, y) {
        this.x = x;
        this.y = y;
        this.cube.position.set(this.x, 0.15, this.y);
    }

    update() {
        // Vérifier quelles touches sont actuellement enfoncées et ajuster les vélocités en conséquence
        if (this.keys.ArrowUp) {
            this.velocity.set(this.speed * Math.sin(this.cube.rotation.y), this.speed * Math.cos(this.cube.rotation.y));
        }
        if (this.keys.ArrowDown) {
            this.velocity.set(-this.speed * Math.sin(this.cube.rotation.y), -this.speed * Math.cos(this.cube.rotation.y));
        }
        if (this.keys.ArrowLeft) {
            this.angularVelocity = 0.05;
        }
        if (this.keys.ArrowRight) {
            this.angularVelocity = -0.05;
        }

        // Mise à jour de la position en fonction de la vélocité
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Mise à jour de la rotation en fonction de la vélocité angulaire
        this.cube.rotation.y += this.angularVelocity;

        // Réduction de la vélocité et de la vélocité angulaire (simule la friction)
        this.velocity.multiplyScalar(0.95);
        this.angularVelocity *= 0.95;

        // Ajout d'un seuil minimum de vélocité pour éviter une décélération excessive
        const minVelocity = 0.01;
        if (Math.abs(this.velocity.x) < minVelocity) this.velocity.x = 0;
        if (Math.abs(this.velocity.y) < minVelocity) this.velocity.y = 0;
        if (Math.abs(this.angularVelocity) < minVelocity) this.angularVelocity = 0;

        // Mise à jour de la position du cube dans la scène
        this.move(this.x, this.y);

        requestAnimationFrame(this.update.bind(this));
    }
}
