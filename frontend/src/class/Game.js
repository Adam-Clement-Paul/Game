import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {scene} from '../script_modules/init3DScene';
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
            this.addPlayer(player.name, player.x, player.y, player.color, player.id);
            this.addTruck(player.x, player.y, player.z);
        });

        if (this.hasStarted) {
            // init tous les joueurs
            this.players.forEach(player => {
                player.init();
            });
            this.board.displayTiles();
        } else {
            // init tous les joueurs
            this.truckList.forEach(truck => {
                truck.init();
            });
            this.initPhysics();
        }

        if (this.players.length > 0 && this.hasStarted) {
            this.players[this.players.length - 1].activePlayer();
        }
        if (this.truckList.length > 0 && !this.hasStarted) {
            this.truckList[this.truckList.length - 1].activeTruck();
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

    addPlayer (name, x, y, color, id) {
        this.players.push(new Player(name, x, y, color, this, this.socket, id));
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
                playerToUpdate.updatePosition(player.x, player.y, player.rotation);
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

    addTruck(x, y, z) {
        this.truckList.push(new Truck(this.world, 0, 20, 0, this.groundMaterial, this.wheelMaterial, this.socket, 1));
    }

    updatePlayground() {
        if (this.world) {
            this.world.step(this.dt);
        }
    }
}
