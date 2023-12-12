import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {gsap} from 'gsap';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

import {camera, scene} from "../script_modules/init3DScene";

let wheelModelL, wheelModelR, truckSize = { w: 3.5, h: 3, l: 8 }, truckGroup;

export class Camion {
    constructor (world, x, y, z, groundMaterial, wheelMaterial, active = false) {
        this.world = world;
        this.x = x;
        this.y = y;
        this.z = z;
        this.groundMaterial = groundMaterial;
        this.wheelMaterial = wheelMaterial;
        this.active = active;

        this.truckGroup = new THREE.Group();
        this.vehicle = null;

        this.loaded = false;
        this.clock = new THREE.Clock();
        this.controllerIndex = null;

        this.loadTruck();
    }

    loadTruck () {
        const loader = new GLTFLoader();

        loader.load('../models/Camion3.glb', (gltf) => {
            this.truck = gltf.scene;
            const animations = gltf.animations;
            this.truck.traverse(function (child) {
                if (child.name === 'wheelL') {
                    wheelModelL = child;
                    child.visible = false;
                }
                if (child.name === 'wheelR') {
                    wheelModelR = child;
                    child.visible = false;
                }
            });

            this.roue1 = wheelModelL.clone();
            this.roue2 = wheelModelR.clone();
            this.roue3 = wheelModelL.clone();
            this.roue4 = wheelModelR.clone();


            let wheels = [this.roue1, this.roue2, this.roue3, this.roue4];
            wheels.forEach((wheel) => {
                wheel.visible = true;
                scene.add(wheel);
            });

            this.truckGroup.add(this.truck);
            scene.add(this.truckGroup);

            this.mixer = new THREE.AnimationMixer(this.truck);

            const animationLumiere = animations.find(
                (clip) => clip.name === 'Lights'
            );
            const action = this.mixer.clipAction(animationLumiere);
            this.mixer = action.getMixer();

            action.setLoop(THREE.LoopRepeat, Infinity);
            action.play();

            this.horn = new Audio('../models/horn.mp3');

            this.createTruck();
        });
    }

    createTruck () {
        const wheelBodies = [];

        const chassisShape = new CANNON.Box(
            new CANNON.Vec3(truckSize.w, truckSize.h, truckSize.l)
        );

        const chassisBody = new CANNON.Body({
            mass: 150,
            material: this.groundMaterial,
        });
        chassisBody.addShape(chassisShape);
        chassisBody.position.set(this.x, this.y, this.z);
        // chassisBody.angularVelocity.set(0, 1, 0);

        const options = {
            radius: 1.2,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: 8,
            suspensionRestLength: 0.8,
            frictionSlip: 1,
            dampingRelaxation: 2.3,
            dampingCompression: 4.4,
            maxSuspensionForce: 100000,
            rollInfluence: 0.01,
            axleLocal: new CANNON.Vec3(-1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 0),
            maxSuspensionTravel: 1,
            customSlidingRotationalSpeed: 15,
            useCustomSlidingRotationalSpeed: true,
        };

        // Create the vehicle
        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: chassisBody,
            indexRightAxis: 0,
            indexUpAxis: 1,
            indexForwardAxis: 2,
        });

        options.chassisConnectionPointLocal.set(truckSize.w - 1, -3, -truckSize.l + 4.5);
        this.vehicle.addWheel(options);

        options.chassisConnectionPointLocal.set(-truckSize.w + 1, -3, -truckSize.l + 4.5);
        this.vehicle.addWheel(options);

        options.chassisConnectionPointLocal.set(truckSize.w - 1, -3, truckSize.l - 3.5);
        this.vehicle.addWheel(options);

        options.chassisConnectionPointLocal.set(-truckSize.w + 1, -3, truckSize.l - 3.5);
        this.vehicle.addWheel(options);

        this.vehicle.addToWorld(this.world);

        this.world.addEventListener('postStep', () => {
            let index = 0;
            this.vehicle.wheelInfos.forEach((wheel) => {
                this.vehicle.updateWheelTransform(index);
                const t = wheel.worldTransform;
                wheelBodies[index].position.copy(t.position);
                wheelBodies[index].quaternion.copy(t.quaternion);
                index++;
            });
        });

        this.vehicle.wheelInfos.forEach((wheel) => {
            const cylinderShape = new CANNON.Cylinder(
                wheel.radius,
                wheel.radius,
                wheel.radius / 2,
                20
            );
            const wheelBody = new CANNON.Body({ mass: 1, material: this.wheelMaterial });
            const q = new CANNON.Quaternion();
            q.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
            wheelBody.addShape(cylinderShape, new CANNON.Vec3(), q);
            wheelBodies.push(wheelBody);
        });

        if (this.active) {
            this.setEvents();
        }
        this.update();
    }

    setEvents () {
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
            this.onKey(ev);
        });
        document.addEventListener('keyup', (ev) => {
            this.onKey(ev);
        });
    }

    onKey (ev) {
        const maxSteerVal = 0.75;
        const maxForce = 500;
        const brakeForce = 5000;

        let up = ev.type == 'keyup';

        if (!up && ev.type !== 'keydown') {
            return;
        }

        this.vehicle.setBrake(0, 0);
        this.vehicle.setBrake(0, 1);
        this.vehicle.setBrake(0, 2);
        this.vehicle.setBrake(0, 3);

        switch (ev.keyCode) {
            case 38: // forward
                this.vehicle.applyEngineForce(up ? 0 : -maxForce, 2);
                this.vehicle.applyEngineForce(up ? 0 : -maxForce, 3);
                break;

            case 40: // backward
                this.vehicle.applyEngineForce(up ? 0 : maxForce, 2);
                this.vehicle.applyEngineForce(up ? 0 : maxForce, 3);
                break;

            case 32: // spacebar
                this.vehicle.setBrake(brakeForce, 0);
                this.vehicle.setBrake(brakeForce, 1);
                // this.vehicle.setBrake(brakeForce, 2);
                // this.vehicle.setBrake(brakeForce, 3);
                break;

            case 39: // right
                this.vehicle.setSteeringValue(up ? 0 : -maxSteerVal, 2);
                this.vehicle.setSteeringValue(up ? 0 : -maxSteerVal, 3);
                break;

            case 37: // left
                this.vehicle.setSteeringValue(up ? 0 : maxSteerVal, 2);
                this.vehicle.setSteeringValue(up ? 0 : maxSteerVal, 3);
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
                this.vehicle.applyEngineForce(button.value * maxForce / 10, 2);
                this.vehicle.applyEngineForce(button.value * maxForce / 10, 3);
            }
            if (i == 7 && button.pressed) {
                this.vehicle.applyEngineForce(button.value * -maxForce, 2);
                this.vehicle.applyEngineForce(button.value * -maxForce, 3);
            }

            if (i == 0 && button.pressed) {
                this.truck.hornSound();
            }

            if (i == 1 && button.pressed) {
                this.vehicle.setBrake(button.value * brakeForce, 0);
                this.vehicle.setBrake(button.value * brakeForce, 1);
            } else if (i == 1 && !button.pressed) {
                this.vehicle.setBrake(0, 0);
                this.vehicle.setBrake(0, 1);
            }

            if (i == 9 && button.pressed) {
                console.log('reset')
                this.respawn();
            }

            if (onepressed == false) {
                this.vehicle.applyEngineForce(0, 2);
                this.vehicle.applyEngineForce(0, 3);
            }
        }
    }

    updateStick (leftRightAxis, upDownAxis) {
        const maxSteerVal = 0.75;
        const multiplier = 1;
        const stickLeftRight = leftRightAxis * multiplier;
        // const stickUpDown = upDownAxis * multiplier;

        if (stickLeftRight > 0.1 || stickLeftRight < -0.1) {
            this.vehicle.setSteeringValue(-stickLeftRight * maxSteerVal, 2);
            this.vehicle.setSteeringValue(-stickLeftRight * maxSteerVal, 3);
        } else {
            this.vehicle.setSteeringValue(0, 2);
            this.vehicle.setSteeringValue(0, 3);
        }
    }

    handleSticks (axes) {
        this.updateStick(axes[0], axes[1]);
        // updateStick(axes[2], axes[3]);
    }

    respawn () {
        this.vehicle.applyEngineForce(0, 2);
        this.vehicle.applyEngineForce(0, 3);
        this.vehicle.setSteeringValue(0, 2);
        this.vehicle.setSteeringValue(0, 3);
        this.vehicle.setBrake(0, 0);
        this.vehicle.setBrake(0, 1);

        this.vehicle.chassisBody.position.set(this.x, this.y, this.z);
        this.vehicle.chassisBody.velocity.set(0, 0, 0);
        this.vehicle.chassisBody.angularVelocity.set(0, 0, 0);
        this.vehicle.chassisBody.quaternion.setFromAxisAngle(
            new CANNON.Vec3(0, 1, 0), 0);
    }

    hornSound () {
        this.horn.currentTime = 0;
        this.horn.play();
    }

    // Updates the camera position and lookAt
    cameraMovements(x, y) {
        let scale = 8;
        camera.position.set(x, 3 * scale, y - 2 * scale);
        camera.lookAt(x, 0, y);
    }


    update () {
        setTimeout((this.update.bind(this)), 1000 / 60);

        if (this.active) {
            this.cameraMovements(this.vehicle.chassisBody.position.x, this.vehicle.chassisBody.position.z);
        }

        /*
        if (this.controllerIndex !== null) {
            const gamepad = navigator.getGamepads()[this.controllerIndex];
            this.handleButtons(gamepad.buttons);
            this.handleSticks(gamepad.axes);
        }
        */

        if (this.mixer) {
            const delta = this.clock.getDelta();
            this.mixer.update(delta);
        }

        if (this.truck) {

            this.truck.position.copy(this.vehicle.chassisBody.position);
            this.truck.quaternion.copy(this.vehicle.chassisBody.quaternion);

            this.roue1.position.copy(this.vehicle.wheelInfos[0].worldTransform.position);
            this.roue1.quaternion.copy(this.vehicle.wheelInfos[0].worldTransform.quaternion);
            this.roue2.position.copy(this.vehicle.wheelInfos[1].worldTransform.position);
            this.roue2.quaternion.copy(this.vehicle.wheelInfos[1].worldTransform.quaternion);
            this.roue3.position.copy(this.vehicle.wheelInfos[2].worldTransform.position);
            this.roue3.quaternion.copy(this.vehicle.wheelInfos[2].worldTransform.quaternion);
            this.roue4.position.copy(this.vehicle.wheelInfos[3].worldTransform.position);
            this.roue4.quaternion.copy(this.vehicle.wheelInfos[3].worldTransform.quaternion);
        }
    }
}
