import {Tile} from './Tile.js';
import {loadModel} from "../script_modules/glbImport";
import {ambientLight, scene} from "../script_modules/init3DScene";
import * as THREE from "three";

/*
* Board class
* number_of_sections: number of sections in the board [need to be greater than 2]
 */
export class Board {
    constructor (board) {
        this.board = board;
        this.tiles = board.tiles;

        this.modelsLoaded = false;

        // Borders
        this.treeInstanceMesh = null;
        this.instances = [];

        let nbrBorder = 0;
        this.tiles.forEach(tile => {
            if (tile.type === 'border') {
                nbrBorder++;
            }
        });

        loadModel('./models/treeBorder.glb', (model) => {
            const geometry = model.children[0].geometry;
            const material = model.children[0].material;
            this.treeInstanceMesh = new THREE.InstancedMesh(geometry, material, nbrBorder);
            this.treeInstanceMesh.position.set(0, 0, 0);
            this.treeInstanceMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            this.treeInstanceMesh.instanceMatrix.needsUpdate = true;

            let instance = new THREE.Object3D();
            const scaleBorder = 0.08;

            this.tiles.forEach((tile) => {
                const gap = 0.2;
                const ramdomX = Math.random() * (gap - (-gap)) + (-gap);
                const ramdomY = Math.random() * (gap - (-gap)) + (-gap);

                if (tile.type === 'border') {
                    instance.position.set(tile.x + ramdomX, 0, tile.y + ramdomY);
                    instance.scale.set(scaleBorder, scaleBorder, scaleBorder);
                    instance.rotation.y = Math.random() * Math.PI;
                    this.instances.push(instance.clone());
                    this.tiles[this.tiles.indexOf(tile)] = new Tile(tile.x, tile.y, tile.fire, tile.type);
                }
                if (tile.type === 'tree') {
                    this.tiles[this.tiles.indexOf(tile)] = new Tile(tile.x, tile.y, tile.fire, tile.type, true);
                }
            });

            scene.add(this.treeInstanceMesh);
            this.modelsLoaded = true;
            this.addShadow();

            loadModel('./models/rock1.glb', (modelRock1) => {
                loadModel('./models/rock2.glb', (modelRock2) => {
                    loadModel('./models/rock3.glb', (modelRock3) => {
                        const scaleRock = 0.5;
                        this.tiles.forEach((tileT) => {
                            if (tileT.type === 'obstacle') {
                                let model;
                                const random = Math.random();
                                if (random < 0.33) {
                                    model = modelRock1.clone();
                                } else if (random < 0.66) {
                                    model = modelRock2.clone();
                                } else {
                                    model = modelRock3.clone();
                                }
                                model.position.set(tileT.x, 0, tileT.y);
                                model.scale.set(scaleRock, scaleRock, scaleRock);
                                scene.add(model);
                                const index = this.tiles.indexOf(tileT);
                                this.tiles[index] = new Tile(tileT.x, tileT.y, tileT.fire, tileT.type);
                            }
                        });
                    });
                });
            });
        });


        this.tiles.forEach(tile => {
            if (tile.type === 'grass') {
                this.tiles[this.tiles.indexOf(tile)] = new Tile(tile.x, tile.y, tile.fire, tile.type);
            }
        });
    }

    // Return the tile at the given position
    getTileAtPosition (x, y) {
        return this.tiles.find(tile => tile.x === x && tile.y === y);
    }

    addShadow () {
        ambientLight.color.setHex(0xf7ffcc);

        // Récupère les 4 tuiles les plus loins (les 4 coins de la map) pour trouver le centre
        const minX = Math.min(...this.tiles.map(tile => tile.x));
        const maxX = Math.max(...this.tiles.map(tile => tile.x));
        const minY = Math.min(...this.tiles.map(tile => tile.y));
        const maxY = Math.max(...this.tiles.map(tile => tile.y));
        const topLeftRightBottom = 25;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const directionalLight = new THREE.DirectionalLight(0xd6c29e, 2);
        directionalLight.position.set(centerX - 8.4, 10, centerY + 10);
        directionalLight.target.position.set(centerX, 0, centerY);

        directionalLight.castShadow = true;
        directionalLight.shadow.camera.near = 0;
        directionalLight.shadow.camera.far = 29;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.left = -topLeftRightBottom;
        directionalLight.shadow.camera.right = topLeftRightBottom;
        directionalLight.shadow.camera.top = topLeftRightBottom;
        directionalLight.shadow.camera.bottom = -topLeftRightBottom;
        directionalLight.shadow.bias = -0.004;
        scene.add(directionalLight);

        /* // GUI avec bias, radius, near, far, left, right, top, bottom
        const gui = new GUI();
        const directionalLightFolder = gui.addFolder('Directional Light');
        directionalLightFolder.add(directionalLight, 'intensity', 0, 10, 0.01);
        directionalLightFolder.addColor(directionalLight, 'color');
        directionalLightFolder.add(directionalLight.shadow, 'bias', -0.1, 0.1, 0.0001);
        directionalLightFolder.add(directionalLight.shadow.mapSize, 'width', 0, 4096, 1);
        directionalLightFolder.add(directionalLight.shadow.mapSize, 'height', 0, 4096, 1);
        directionalLightFolder.add(directionalLight.position, 'x', -topLeftRightBottom, topLeftRightBottom, 0.1);
        directionalLightFolder.add(directionalLight.position, 'y', -topLeftRightBottom, topLeftRightBottom, 0.1);
        directionalLightFolder.add(directionalLight.position, 'z', -topLeftRightBottom, topLeftRightBottom, 0.1);
        directionalLightFolder.add(directionalLight.target.position, 'x', -topLeftRightBottom, topLeftRightBottom, 0.1);
        directionalLightFolder.add(directionalLight.target.position, 'y', -topLeftRightBottom, topLeftRightBottom, 0.1);
        directionalLightFolder.add(directionalLight.target.position, 'z', -topLeftRightBottom, topLeftRightBottom, 0.1);
        directionalLightFolder.add(directionalLight.shadow.camera, 'near', 0, 100, 0.1);
        directionalLightFolder.add(directionalLight.shadow.camera, 'far', 0, 100, 0.1);
        directionalLightFolder.add(directionalLight.shadow.camera, 'left', -topLeftRightBottom, topLeftRightBottom, 0.1);
        directionalLightFolder.add(directionalLight.shadow.camera, 'right', -topLeftRightBottom, topLeftRightBottom, 0.1);
        directionalLightFolder.add(directionalLight.shadow.camera, 'top', -topLeftRightBottom, topLeftRightBottom, 0.1);
        directionalLightFolder.add(directionalLight.shadow.camera, 'bottom', -topLeftRightBottom, topLeftRightBottom, 0.1);
        directionalLightFolder.onChange(() => {
            // Actualise la lumière
            console.log('update');
            scene.remove(directionalLight);
            scene.add(directionalLight);
            directionalLight.shadow.camera.updateProjectionMatrix();
        });
        directionalLightFolder.open()
         */
    }

    updateBoard (tilesToUpdate) {
        tilesToUpdate.forEach(tileToUpdate => {
            const index = tileToUpdate[0];

            if (this.tiles[index].type === 'tree' && tileToUpdate[1].type === 'grass') {
                this.tiles[index].cutTree();
            } else if (this.tiles[index].type === 'tree' && tileToUpdate[1].fire === 0 && this.tiles[index].fire !== 0) {
                this.tiles[index].setFire(0);
            } else if (this.tiles[index].type === 'tree' && tileToUpdate[1].life !== this.tiles[index].life) {
                this.tiles[index].axeStroke();
            } else if (this.tiles[index].type === 'tree' && tileToUpdate[1].fire !== this.tiles[index].fire) {
                this.tiles[index].setFire(tileToUpdate[1].fire);
            } else if (this.tiles[index].type !== 'tree' && tileToUpdate[1].type !== 'tree') {
                this.tiles[index] = null;
                this.tiles[index] = new Tile(tileToUpdate[1].x, tileToUpdate[1].y, tileToUpdate[1].fire, tileToUpdate[1].type);
            }
            this.tiles[index].updateDisplay();
        });
    }

    hideBoard () {
        this.tiles.forEach(tile => {
            tile.hide();
        });
    }

    suppressInstances () {
        this.treeInstanceMesh.dispose();
        this.treeInstanceMesh.count = 0;
    }
}
