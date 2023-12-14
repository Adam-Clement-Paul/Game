import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {camera, scene} from '../script_modules/init3DScene';
import {Board} from './Board.js';
import {Player} from './Player.js';
import {Truck} from './Truck';

export class Game {
    constructor (board, players, socket, hasStarted) {
        // this.board = new Board(board);
        this.playersBackend = players;
        this.players = [];
        this.truckList = [];
        this.socket = socket;
        this.hasStarted = hasStarted;

        this.world = new CANNON.World();
        this.dt = 1 / 30;
        this.groundMaterial = new CANNON.Material('this.groundMaterial');
        this.wheelMaterial = new CANNON.Material('this.wheelMaterial');

        this.playersBackend.forEach(player => {
            //this.addPlayer(player.id, player.name, player.x, player.y, player.color);
            this.addTruck(player.id, player.name, player.x, player.y, player.z, 'Camion3.glb');
        });

        if (this.hasStarted) {
            camera.near = 0.1;
            camera.far = 20;
            this.players.forEach(player => {
                player.init();
            });
            this.board.displayTiles();
        } else {
            camera.near = 10;
            camera.far = 80;
            this.initPhysics();
            this.truckList.forEach(truck => {
                truck.init();
            });
        }

        if (this.players.length > 0 && this.hasStarted) {
            this.players[this.players.length - 1].setActive();
        }
        if (this.truckList.length > 0 && !this.hasStarted) {
            this.truckList[this.truckList.length - 1].setActive();
        }
    }

    start () {
        for (let i = 0; i < this.players.length; i++) {
            console.log(`Player ${i + 1} : ${this.players[i].name}`);
        }

        // Activate the fire growth
        this.board.tiles.forEach(tile => {
            if (tile.fire !== 0) {
                tile.growingFire();
            }
        });
        // Activate the contamination
        this.board.fireContamination(0);

        // Start the game loop
        this.timeGameLoop = 0;
        this.gameLoop();
    }

    getBoard () {
        return this.board;
    }

    addPlayer (id, name, x, y, color) {
        this.players.push(new Player(id, x, y, 0, color, this, this.socket));
    }

    removePlayer (id) {
        const player = this.players.filter(player => player.id === id);
        if (player.length > 0) {
            player.forEach(player => {
                player.remove();
            });
        }
        this.players = this.players.filter(player => player.id !== id);
    }

    updatePlayers (playersData) {
        const keys = Object.keys(playersData);

        for (let i = 0; i < keys.length; i++) {
            let player = playersData[keys[i]];
            let playerToUpdate = this.players[i];

            if (playerToUpdate && !playerToUpdate.active) {
                playerToUpdate.updatePosition(player.x, player.y, player.z, player.rotation);
            }
        }
    }

    /* Playground */

    initPhysics () {
        const geometry = new THREE.PlaneGeometry(500, 500, 100, 100);
        const material = new THREE.MeshBasicMaterial({
            color: 0x555555,
            side: THREE.DoubleSide,
            wireframe: true,
        });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotateX(Math.PI / 2);
        scene.add(plane);

        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.gravity.set(0, -9.82, 0);
        this.world.defaultContactMaterial.friction = 0.01;

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

    addTruck(id, name, x, y, z, model) {
        this.truckList.push(
            new Truck(1, 0, 20, 0, 0, model, this.world, this.groundMaterial, this.wheelMaterial, this.socket)
        );
    }

    updatePlayground() {
        if (this.world) {
            this.world.step(this.dt);
        }
    }
}
