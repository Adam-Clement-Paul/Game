import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

import {scene, loadingManager} from '../script_modules/init3DScene';
import {Player} from './Player';

const KEY_FORWARD = 'z';
const KEY_BACKWARD = 's';
const KEY_SPACEBAR = ' ';
const KEY_LEFT = 'q';
const KEY_RIGHT = 'd';
const KEY_HORN = 'w';
const KEY_RESET = 'r';

export class Truck extends Player {
    static truckSize = { w: 3.5, h: 3, l: 8 };

    constructor (id, name, x, y, z, rotation, models, world, groundMaterial, wheelMaterial, socket, active = false) {
        super(id, name, x, y, z, rotation, socket, active);
        this.id = id;
        this.x = x;
        this.y = y;
        this.z = z;
        this.rotation = rotation;

        this.models = models;
        this.world = world;
        this.groundMaterial = groundMaterial;
        this.wheelMaterial = wheelMaterial;
        this.socket = socket;
        this.active = active;

        this.truckGroup = new THREE.Group();
        this.vehicle = null;

        this.timer2 = 0;

        this.clock = new THREE.Clock();
        this.controllerIndex = null;

        this.loadTruck(() => {
            this.createTruck();
            this.update();
        });
    }

    setActive () {
        this.active = true;
        this.horn = new Audio('../models/horn.mp3');

        window.addEventListener('gamepadconnected', (event) => {
            const gamepad = event.gamepad;
            this.controllerIndex = gamepad.index;
            console.log('connected');
        });
        window.addEventListener('gamepaddisconnected', (event) => {
            this.controllerIndex = null;
            console.log('disconnected');
        });
        document.addEventListener('keydown', (event) => this.onDocumentKeyEvent(true, event), false);
        document.addEventListener('keyup', (event) => this.onDocumentKeyEvent(false, event), false);

        const startButton = document.getElementById('start');
        startButton.addEventListener('click', event => {
            if (this.socket) {
                this.socket.send(JSON.stringify({
                    type: 'requestStartGame',
                    playerId: this.id
                }));
            }
        });

        this.sendPosition('move');
    }

    loadTruck (callback) {
        const loader = new GLTFLoader(loadingManager);
        let wheelModelL, wheelModelR;

        loader.load(`https://pyrofighters.online:4040/files/${this.models['truck']}?type=glb`, (gltf) => {
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

            this.wheel1 = wheelModelL.clone();
            this.wheel2 = wheelModelR.clone();
            this.wheel3 = wheelModelL.clone();
            this.wheel4 = wheelModelR.clone();

            let wheels = [this.wheel1, this.wheel2, this.wheel3, this.wheel4];
            wheels.forEach((wheel) => {
                wheel.visible = true;
                scene.add(wheel);
            });

            this.truckGroup.add(this.truck);
            scene.add(this.truckGroup);

            // Animation
            this.mixer = new THREE.AnimationMixer(this.truck);

            const animationLumiere = animations.find(
                (clip) => clip.name === 'Lights'
            );
            const action = this.mixer.clipAction(animationLumiere);
            this.mixer = action.getMixer();

            action.setLoop(THREE.LoopRepeat, Infinity);
            action.play();

            callback();
        });
    }

    createTruck () {
        const wheelBodies = [];

        const chassisShape = new CANNON.Box(
            new CANNON.Vec3(Truck.truckSize.w, Truck.truckSize.h, Truck.truckSize.l)
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

        const wheelPositions = [
            { x: Truck.truckSize.w - 1, y: -3, z: -Truck.truckSize.l + 4.5 },
            { x: -Truck.truckSize.w + 1, y: -3, z: -Truck.truckSize.l + 4.5 },
            { x: Truck.truckSize.w - 1, y: -3, z: Truck.truckSize.l - 3.5 },
            { x: -Truck.truckSize.w + 1, y: -3, z: Truck.truckSize.l - 3.5 },
        ];

        for (const position of wheelPositions) {
            options.chassisConnectionPointLocal.set(position.x, position.y, position.z);
            this.vehicle.addWheel(options);
        }

        this.vehicle.addToWorld(this.world);
        this.rotation = this.vehicle.chassisBody.quaternion;

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
    }

    onDocumentKeyEvent (isKeyDown, event) {
        const maxSteerVal = 0.75;
        const maxForce = 500;
        const brakeForce = 5000;

        this.vehicle.setBrake(0, 0);
        this.vehicle.setBrake(0, 1);
        this.vehicle.setBrake(0, 2);
        this.vehicle.setBrake(0, 3);

        switch (event.key) {
            case KEY_FORWARD:
                this.vehicle.applyEngineForce(isKeyDown ? -maxForce : 0, 2);
                this.vehicle.applyEngineForce(isKeyDown ? -maxForce : 0, 3);
                break;

            case KEY_BACKWARD:
                this.vehicle.applyEngineForce(isKeyDown ? maxForce : 0, 2);
                this.vehicle.applyEngineForce(isKeyDown ? maxForce : 0, 3);
                break;

            case KEY_SPACEBAR:
                this.vehicle.setBrake(brakeForce, 0);
                this.vehicle.setBrake(brakeForce, 1);
                // this.vehicle.setBrake(brakeForce, 2);
                // this.vehicle.setBrake(brakeForce, 3);
                break;

            case KEY_RIGHT:
                this.vehicle.setSteeringValue(isKeyDown ? -maxSteerVal : 0, 2);
                this.vehicle.setSteeringValue(isKeyDown ? -maxSteerVal : 0, 3);
                break;

            case KEY_LEFT:
                this.vehicle.setSteeringValue(isKeyDown ? maxSteerVal : 0, 2);
                this.vehicle.setSteeringValue(isKeyDown ? maxSteerVal : 0, 3);
                break;

            case KEY_HORN:
                this.hornSound();
                break;

            case KEY_RESET:
                this.respawn();
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

            if (i === 6 && button.pressed) {
                this.vehicle.applyEngineForce(button.value * maxForce / 10, 2);
                this.vehicle.applyEngineForce(button.value * maxForce / 10, 3);
            }
            if (i === 7 && button.pressed) {
                this.vehicle.applyEngineForce(button.value * -maxForce, 2);
                this.vehicle.applyEngineForce(button.value * -maxForce, 3);
            }

            if (i === 0 && button.pressed) {
                this.hornSound();
            }

            if (i === 1 && button.pressed) {
                this.vehicle.setBrake(button.value * brakeForce, 0);
                this.vehicle.setBrake(button.value * brakeForce, 1);
            } else if (i === 1 && !button.pressed) {
                this.vehicle.setBrake(0, 0);
                this.vehicle.setBrake(0, 1);
            }

            if (i === 9 && button.pressed) {
                console.log('reset')
                this.respawn();
            }

            if (onepressed === false) {
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

    update () {
        this.timer2 = setTimeout((this.update.bind(this)), 1000 / 60);

        if (this.active) {
            this.vehicle.chassisBody.quaternion.copy(this.rotation);
            this.x = this.vehicle.chassisBody.position.x;
            this.y = this.vehicle.chassisBody.position.y;
            this.z = this.vehicle.chassisBody.position.z;
            this.cameraMovements(this.x, this.z, 10, 0);
        }

        if (this.controllerIndex !== null) {
            const gamepad = navigator.getGamepads()[this.controllerIndex];
            this.handleButtons(gamepad.buttons);
            this.handleSticks(gamepad.axes);
        }

        if (this.mixer) {
            const delta = this.clock.getDelta();
            this.mixer.update(delta);
        }

        if (this.truck && this.vehicle) {
            if (!this.active) {
                this.vehicle.chassisBody.position.set(this.x, this.y, this.z);
                this.vehicle.chassisBody.quaternion.copy(this.rotation);
            }

            this.truck.position.copy(this.vehicle.chassisBody.position);
            this.truck.quaternion.copy(this.vehicle.chassisBody.quaternion);

            this.wheel1.position.copy(this.vehicle.wheelInfos[0].worldTransform.position);
            this.wheel1.quaternion.copy(this.vehicle.wheelInfos[0].worldTransform.quaternion);
            this.wheel2.position.copy(this.vehicle.wheelInfos[1].worldTransform.position);
            this.wheel2.quaternion.copy(this.vehicle.wheelInfos[1].worldTransform.quaternion);
            this.wheel3.position.copy(this.vehicle.wheelInfos[2].worldTransform.position);
            this.wheel3.quaternion.copy(this.vehicle.wheelInfos[2].worldTransform.quaternion);
            this.wheel4.position.copy(this.vehicle.wheelInfos[3].worldTransform.position);
            this.wheel4.quaternion.copy(this.vehicle.wheelInfos[3].worldTransform.quaternion);
        }
    }

    remove () {
        clearTimeout(this.timer2);
        clearTimeout(this.timer);

        scene.remove(this.truck);
        scene.remove(this.wheel1);
        scene.remove(this.wheel2);
        scene.remove(this.wheel3);
        scene.remove(this.wheel4);
        scene.remove(this.truckGroup);

        if (this.active) {
            document.removeEventListener('keydown', (event) => this.onDocumentKeyEvent(true, event), false);
            document.removeEventListener('keyup', (event) => this.onDocumentKeyEvent(false, event), false);
        }
    }
}
