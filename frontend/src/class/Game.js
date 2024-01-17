import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import gsap from 'gsap';

import {camera, scene, renderer, changeWindowResize} from '../script_modules/init3DScene';
import {Board} from './Board.js';
import {Firefighter} from './Firefighter.js';
import {Truck} from './Truck';
import {stopWaiting, waiting} from "../waiting";


export class Game {
    static WIN_TEXT = 'You\'ve beaten the flames!';
    static WIN_IMAGE = 'smoke.jpg';
    static WIN_COINS = 100;
    static LOSE_TEXT = 'Mission failed';
    static LOSE_IMAGE = 'fire.jpg';
    static LOSE_COINS = 0;
    static MAX_DURATION = 300;

    constructor (board, players, socket, hasStarted, owner) {
        this.playersBackend = players;
        this.players = [];
        this.truckList = [];
        this.socket = socket;
        this.hasStarted = hasStarted;
        this.owner = owner;

        this.boardConfig = board;

        this.world = new CANNON.World();
        this.dt = 1 / 30;
        this.groundMaterial = new CANNON.Material('this.groundMaterial');
        this.wheelMaterial = new CANNON.Material('this.wheelMaterial');

        this.playersBackend.forEach(player => {
            this.addPlayer(player.id, player.name, player.models);
        });

        if (this.hasStarted) {
            camera.near = 0.1;
            camera.far = 20;

            this.board = new Board(this.boardConfig);

            document.querySelector('#start').remove();
            document.querySelector('#bottomCode p').remove();
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
            if (this.owner === this.truckList[this.truckList.length - 1].id) {
                document.querySelector('#start').style.display = 'inline';
            } else {
                waiting();
            }
        }
    }

    goToGame () {
        this.hasStarted = true;
        camera.near = 0.1;
        camera.far = 20;

        // Remove "Waiting for players" message and the start button
        let lobby = document.getElementsByClassName('lobby');
        while (lobby.length > 0) {
            lobby[0].remove();
        }
        stopWaiting();

        const spanTimer = document.getElementById('timer');
        spanTimer.innerHTML = `${Game.MAX_DURATION}`;
        setTimeout(() => this.timerLoop(spanTimer, Game.MAX_DURATION), 3000);

        this.truckList.forEach(truck => {
            truck.remove();
            truck.timer = null;
            truck = null;
        });
        scene.remove(this.truckList);
        this.removePlayground();

        this.board = new Board(this.boardConfig);

        // Add the players to the game
        this.truckList.forEach(player => {
            this.addPlayer(player.id, player.name, player.models);
        });

        this.truckList = [];

        camera.position.set(4, 3, 1);
        camera.lookAt(4, 0, 3);
    }

    timerLoop (spanTimer, time) {
        if (this.hasStarted) {
            let timeLeft = time - 1
            if (time <= 0) {
                timeLeft = 0;
            }
            spanTimer.innerHTML = `${timeLeft}`;
            setTimeout(() => this.timerLoop(spanTimer, timeLeft), 1000);
        }
    }

    addPlayer (id, name, models) {
        if (this.hasStarted) {
            let player = new Firefighter(id, name, 4, 3, 0, models, this, this.socket);
            this.truckList.forEach(truck => {
                if (truck.id === id && truck.active) {
                    player.setActive();
                }
            });
            this.players.push(player);
        } else {
            let player = new Truck(id, name, 0, 20, 0, 0, models, this.world, this.groundMaterial, this.wheelMaterial, this.socket);
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
        const playersDataArray = Object.values(playersData);
        for (const playersData of playersDataArray) {
            let player;
            if (this.hasStarted) {
                player = this.players.find(p => p.id === playersData.id);
            } else {
                player = this.truckList.find(p => p.id === playersData.id);
            }
            if (player && !player.active) {
                player.updatePosition(playersData.x, playersData.y, playersData.z, playersData.rotation);
            }
        }
    }

    gameOver (time, playersData, win) {
        let text, image, coins;
        if (win) {
            text = Game.WIN_TEXT;
            image = Game.WIN_IMAGE;
            coins = Game.WIN_COINS;
        } else {
            text = Game.LOSE_TEXT;
            image = Game.LOSE_IMAGE;
            coins = Game.LOSE_COINS;

            const next = document.getElementById('next');
            next.remove();

            // Change the color of the menu button, because this is the only button left
            const menu = document.getElementById('menu');
            menu.classList.remove('btn-secondary');
            menu.classList.add('btn-yellow');
        }
        this.hasStarted = null;
        const spanTimer = document.getElementById('timer');
        // Suppress the timer
        spanTimer.parentNode.removeChild(spanTimer);

        // Manage board instances
        this.board.suppressInstances();

        // ---------- Set content in the html
        const title = document.querySelector('.gameOverMain > h1');
        title.innerHTML = text;

        const gameOver = document.getElementById('gameOver');
        gameOver.style.display = 'flex';
        gameOver.style.backgroundImage = `url(../images/${image})`;

        const playerName = document.getElementById('playerName');
        playerName.innerHTML = this.players.find(player => player.active).name;

        const missionDuration = document.getElementById('missionDuration');
        missionDuration.innerHTML = `${Math.floor(time / 60000)}min ${Math.floor(time / 1000) % 60}s`;

        const player = this.players.find(player => player.active);
        const fires = playersData.find(data => data[0] === player.id)[1];
        const trees = playersData.find(data => data[0] === player.id)[2];

        const flamesExtinguished = document.getElementById('flamesExting');
        flamesExtinguished.innerHTML = fires;

        const treesCutted = document.getElementById('treesCutted');
        treesCutted.innerHTML = trees;

        const coinsEarned = document.getElementById('coinsEarned');
        coinsEarned.innerHTML = coins;
        // ----------

        const webgl = document.getElementById('webgl');
        // Place the game over message after the canvas
        webgl.parentNode.insertBefore(gameOver, webgl.nextSibling);
        webgl.style.width = '67%';
        webgl.style.left = null;
        webgl.style.right = '0';

        // Adapt the canvas size
        changeWindowResize();
        renderer.setSize(window.innerWidth * 0.67, window.innerHeight);
        camera.aspect = window.innerWidth * 0.67 / window.innerHeight;
        scene.background = null;

        this.board.hideBoard();
        this.players.forEach(player => {
            player.stopMoving();
        })

        // Make the camera look at the player
        let tl = gsap.timeline();
        let lookAt = new THREE.Vector3(player.x, 0, player.y);
        tl.to(camera.position, {
            duration: 3,
            y: 1,
            ease: 'power2.inOut'}
        ).to(lookAt, {
            duration: 3,
            y: 0.8,
            onUpdate: () => {
                camera.lookAt(lookAt);
            }
        }, '<');
    }

    playAnimation (animation, playerId) {
        const player = this.players.find(player => player.id === playerId);
        if (player && !player.active) {
            player.fadeToAction(animation, 0.2);
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

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        scene.add(this.directionalLight);
    }

    removePlayground () {
        scene.remove(this.directionalLight);
        scene.remove(this.plane);
        this.world = null;
    }

    updatePlayground () {
        if (this.world && !this.hasStarted) {
            this.world.step(this.dt);
        }
    }
}
