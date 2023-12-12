import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {Camion} from './Camion.js';
import {scene} from "../script_modules/init3DScene";


export class Playground {

    constructor () {
        this.world = new CANNON.World();
        this.dt = 1 / 30;
        this.truckList = [];

        this.controllerIndex;
        this.groundMaterial;
        this.wheelMaterial;

        this.init();
    }

    init () {
        const geometry = new THREE.PlaneGeometry(500, 500, 100, 100);
        const material = new THREE.MeshBasicMaterial({
            color: 0x555555,
            side: THREE.DoubleSide,
            wireframe: true,
        });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotateX(Math.PI / 2);
        scene.add(plane);

        this.initPhysics();
    }

    initPhysics () {
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.gravity.set(0, -9.82, 0);
        this.world.defaultContactMaterial.friction = 0.01;

        this.groundMaterial = new CANNON.Material('this.groundMaterial');
        this.wheelMaterial = new CANNON.Material('this.wheelMaterial');
        const wheelGroundContactMaterial = new CANNON.ContactMaterial(
            this.wheelMaterial,
            this.groundMaterial,
            {
                friction: 0.75,
                restitution: 0,
                contactEquationStiffness: 1000,
            }
        );

        // We must add the contact materials to the this.world
        this.world.addContactMaterial(wheelGroundContactMaterial);

        // Add plane to this.scene
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0, material: this.groundMaterial });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(
            new CANNON.Vec3(1, 0, 0),
            -Math.PI / 2
        );
        this.world.addBody(groundBody);
    }

    addTruck(x, y, z, active) {
         this.truckList.push(new Camion(this.world, x, y, z, this.groundMaterial, this.wheelMaterial, active).vehicle);
    }

    update() {
        if (this.world) {
            this.world.step(this.dt);
        }
    }
}
