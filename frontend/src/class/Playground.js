import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Camion from './Camion.js';


export class Playground {

    constructor () {
        this.scene,
            this.camera,
            this.renderer,
            this.world,
            this.vehicule,
            this.dt,
            this.light,
            this.controls,
            this.controllerIndex,
            this.groundMaterial,
            this.wheelMaterial,
            this.truckList = [],
            this.truck;

        this.init();
    }

    init () {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xaaaaff);

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 50, 100);
        this.camera.lookAt(0, 0, 0);

        const ambient = new THREE.HemisphereLight(0x555555, 0xffffff);
        this.scene.add(ambient);

        // this.light = new THREE.DirectionalLight(0xffffff, 0.5);
        // this.light.position.set(1, 1.25, 1.25);
        // this.light.castShadow = true;
        // const size = 15;
        // this.light.shadow.left = -size;
        // this.light.shadow.bottom = -size;
        // this.light.shadow.right = size;
        // this.light.shadow.top = size;
        // this.scene.add(this.light);

        const geometry = new THREE.PlaneGeometry(500, 500, 100, 100);
        const material = new THREE.MeshBasicMaterial({
            color: 0x555555,
            side: THREE.DoubleSide,
            wireframe: true,
        });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotateX(Math.PI / 2);
        this.scene.add(plane);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: document.querySelector('#webgl')
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;

        // this.controls = new Orbitthis.controls(this.camera, this.renderer.domElement);


        this.initPhysics();

        this.controllerIndex = null;

        // setTimeout(this.update, 1000);

        window.addEventListener('resize', this.onWindowResize, false);
        window.addEventListener('gamepadconnected', (event) => {
            const gamepad = event.gamepad;
            this.controllerIndex = gamepad.index;
            console.log('connected');
        });

        window.addEventListener('gamepaddisconnected', (event) => {
            this.controllerIndex = null;
            console.log('disconnected');
        });

        document.addEventListener('keydown', (ev) => {
            this.onKey(ev)
        });
        document.addEventListener('keyup', (ev) => {
            this.onKey(ev)
        });

        // this.update();

    }

    onKey (ev) {
        const maxSteerVal = 0.75;
        const maxForce = 500;
        const brakeForce = 5000;

        var up = ev.type == 'keyup';

        if (!up && ev.type !== 'keydown') {
            return;
        }

        this.vehicule.setBrake(0, 0);
        this.vehicule.setBrake(0, 1);
        this.vehicule.setBrake(0, 2);
        this.vehicule.setBrake(0, 3);

        switch (ev.keyCode) {
            case 38: // forward
                this.vehicule.applyEngineForce(up ? 0 : -maxForce, 2);
                this.vehicule.applyEngineForce(up ? 0 : -maxForce, 3);
                break;

            case 40: // backward
                this.vehicule.applyEngineForce(up ? 0 : maxForce, 2);
                this.vehicule.applyEngineForce(up ? 0 : maxForce, 3);
                break;

            case 32: // spacebar
                this.vehicule.setBrake(brakeForce, 0);
                this.vehicule.setBrake(brakeForce, 1);
                // this.vehicule.setBrake(brakeForce, 2);
                // this.vehicule.setBrake(brakeForce, 3);
                break;

            case 39: // right
                this.vehicule.setSteeringValue(up ? 0 : -maxSteerVal, 2);
                this.vehicule.setSteeringValue(up ? 0 : -maxSteerVal, 3);
                break;

            case 37: // left
                this.vehicule.setSteeringValue(up ? 0 : maxSteerVal, 2);
                this.vehicule.setSteeringValue(up ? 0 : maxSteerVal, 3);
                break;
            case 87: // w
                this.truck.hornSound();
                break;
        }
    }

    handleButtons (buttons) {
        const maxForce = 5000;
        const brakeForce = 5000;
        let onepressed = false;
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            button.pressed ? (onepressed = true) : onepressed = onepressed;

            if (i == 6 && button.pressed) {
                this.vehicule.applyEngineForce(button.value * maxForce / 10, 2);
                this.vehicule.applyEngineForce(button.value * maxForce / 10, 3);
            }
            if (i == 7 && button.pressed) {
                this.vehicule.applyEngineForce(button.value * -maxForce, 2);
                this.vehicule.applyEngineForce(button.value * -maxForce, 3);
            }

            if (i == 0 && button.pressed) {
                this.truck.hornSound();
            }

            if (i == 1 && button.pressed) {
                this.vehicule.setBrake(button.value * brakeForce, 0);
                this.vehicule.setBrake(button.value * brakeForce, 1);
            } else if (i == 1 && !button.pressed) {
                this.vehicule.setBrake(0, 0);
                this.vehicule.setBrake(0, 1);
            }

            if (i == 9 && button.pressed) {
                console.log('reset')
                this.respawn();
            }

            if (onepressed == false) {
                this.vehicule.applyEngineForce(0, 2);
                this.vehicule.applyEngineForce(0, 3);
            }
        }
    }

    updateStick (leftRightAxis, upDownAxis) {
        const maxSteerVal = 0.75;
        const multiplier = 1;
        const stickLeftRight = leftRightAxis * multiplier;
        // const stickUpDown = upDownAxis * multiplier;

        if (stickLeftRight > 0.1 || stickLeftRight < -0.1) {
            this.vehicule.setSteeringValue(-stickLeftRight * maxSteerVal, 2);
            this.vehicule.setSteeringValue(-stickLeftRight * maxSteerVal, 3);
        } else {
            this.vehicule.setSteeringValue(0, 2);
            this.vehicule.setSteeringValue(0, 3);
        }
    }

    handleSticks (axes) {
        this.updateStick(axes[0], axes[1]);
        // updateStick(axes[2], axes[3]);
    }

    initPhysics () {
        this.world = new CANNON.World();

        this.dt = 1 / 30;

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


    onWindowResize (event) {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    async addTruck (x, y, z) {
        if (this.truckList.length === 0) {
            this.truck = await new Camion(this.scene, this.world, x, y, z, this.groundMaterial, this.wheelMaterial);
            this.truckList.push(this.truck);
            this.vehicule = this.truck.vehicle;
            return this.vehicule;
        } else {
            const truck = await new Camion(this.scene, this.world, x, y, z, this.groundMaterial, this.wheelMaterial);
            this.truckList.push(truck);
        }
    }


    update () {
        if (this.world) {
            this.world.step(this.dt);
        }

        if (this.controllerIndex !== null) {
            const gamepad = navigator.getGamepads()[this.controllerIndex];
            this.handleButtons(gamepad.buttons);
            this.handleSticks(gamepad.axes);
        }

        if (this.truckList) {
            this.truckList.forEach((truck) => {
                truck.update();
            });
        }

        if (this.vehicule) {
            this.camera.position.set(
                this.vehicule.chassisBody.position.x,
                this.vehicule.chassisBody.position.y + 50,
                this.vehicule.chassisBody.position.z + 100
            );
        }


        // this.controls.update();
        if (this.renderer) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    respawn () {
        this.vehicule.applyEngineForce(0, 2);
        this.vehicule.applyEngineForce(0, 3);
        this.vehicule.setSteeringValue(0, 2);
        this.vehicule.setSteeringValue(0, 3);
        this.vehicule.setBrake(0, 0);
        this.vehicule.setBrake(0, 1);
        this.truck.respawn();
    }
}


export default Playground;
