import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

let
    wheelModelL,
    wheelModelR,
    truckSize = { w: 3.5, h: 3, l: 8 },
    truckGroup;

class Camion {
    constructor (scene, world, x, y, z, groundMaterial, wheelMaterial) {
        this.scene = scene;
        this.world = world;
        this.x = x;
        this.y = y;
        this.z = z;
        this.groundMaterial = groundMaterial;
        this.wheelMaterial = wheelMaterial;
        this.clock = new THREE.Clock();
        this.init();
    }

    init () {
        truckGroup = new THREE.Group();
        this.createTruck();
    }

    createTruck () {
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
            this.roue1.visible = true;
            this.roue2.visible = true;
            this.roue3.visible = true;
            this.roue4.visible = true;
            this.scene.add(this.roue1);
            this.scene.add(this.roue2);
            this.scene.add(this.roue3);
            this.scene.add(this.roue4);

            truckGroup.add(this.truck);
            this.mixer = new THREE.AnimationMixer(this.truck);

            const animationLumiere = animations.find(
                (clip) => clip.name === 'Lights'
            );
            const action = this.mixer.clipAction(animationLumiere);
            this.mixer = action.getMixer();

            action.setLoop(THREE.LoopRepeat, Infinity);
            action.play();

            this.horn = new Audio('../models/horn.mp3');
        });


        this.scene.add(truckGroup);

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

        const wheelBodies = [];
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

    }

    update () {
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

    respawn () {
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
}

export default Camion;
