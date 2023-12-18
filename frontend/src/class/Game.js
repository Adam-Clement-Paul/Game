import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import {camera, scene} from '../script_modules/init3DScene';
import {Board} from './Board.js';
import {Firefighter} from './Firefighter.js';
import {Truck} from './Truck';

export class Game {
    constructor (board, players, socket, hasStarted) {
        this.playersBackend = players;
        this.players = [];
        this.truckList = [];
        this.socket = socket;
        this.hasStarted = hasStarted;

        this.boardConfig = board;

        this.world = new CANNON.World();
        this.dt = 1 / 30;
        this.groundMaterial = new CANNON.Material('this.groundMaterial');
        this.wheelMaterial = new CANNON.Material('this.wheelMaterial');

        this.playersBackend.forEach(player => {
            this.addPlayer(player.id, player.name, player.color);
        });

        if (this.hasStarted) {
            camera.near = 0.1;
            camera.far = 20;

            this.board = new Board(this.boardConfig);
            this.board.displayTiles();
        } else {
            camera.near = 10;
            camera.far = 80;
            this.initPhysics();
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

    goToGame (players) {
        this.hasStarted = true;
        camera.near = 0.1;
        camera.far = 20;

        this.truckList.forEach(truck => {
            truck.remove();
        });
        scene.remove(this.truckList);
        this.removePlayground();

        this.board = new Board(this.boardConfig);
        this.board.displayTiles();

        // Add the players to the game
        players.forEach(player => {
            this.addPlayer(player.id, player.name, player.color);
        });

        this.truckList = [];

        camera.position.set(4, 3, 1);
        camera.lookAt(4, 0, 3);
    }

    addPlayer (id, name, color) {
        if (this.hasStarted) {
            let player = new Firefighter(id, 4, 3, 0, color, this, this.socket);
            this.truckList.forEach(truck => {
                if (truck.id === id) {
                    player.setActive();
                }
            });
            this.players.push(player);
        } else {
            let player = new Truck(id, 0, 20, 0, 0, 'Camion3.glb', this.world, this.groundMaterial, this.wheelMaterial, this.socket);
            this.truckList.push(player);
        }
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
            let playerToUpdate;
            if (this.hasStarted) {
                playerToUpdate = this.players[i];
            } else {
                playerToUpdate = this.truckList[i];
            }
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
        this.plane = new THREE.Mesh(geometry, material);
        this.plane.rotateX(Math.PI / 2);
        scene.add(this.plane);

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

    removePlayground() {
        scene.remove(this.plane);
        this.world = null;
    }

    updatePlayground() {
        if (this.world && !this.hasStarted) {
            this.world.step(this.dt);
        }
    }
}
