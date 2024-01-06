import {Tile} from './Tile.js';
import {loadModel} from "../script_modules/glbImport";
import {scene} from "../script_modules/init3DScene";
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
        this.treeInstanceMesh = [];
        this.instances = [];
        let scale = 0.08;

        this.nbTree = 0;
        this.tiles.forEach(tile => {
            if (tile.type === 'tree') {
                this.nbTree++;
            }
        });


        /*loadModel('./models/tree.glb', (model) => {
            this.tree = model;
            this.tree.scale.set(scale, scale, scale);
            this.tree.position.set(0, 0, 0);
            scene.add(this.tree);
        });*/

        this.instance = new THREE.Object3D();
        loadModel('./models/tree.glb', (model) => {
            for (let i = 0; i < 2; i++) {
                console.log(model.children[i]);
                const geometry = model.children[i].geometry;
                const material = model.children[i].material;

                this.treeInstanceMesh[i] = new THREE.InstancedMesh(geometry, material, this.nbTree);
                this.treeInstanceMesh[i].position.set(0, 0, 0);
                this.treeInstanceMesh[i].instanceMatrix.setUsage(THREE.DynamicDrawUsage);

                this.tiles.forEach((tile, index) => {
                    if (tile.type === 'tree') {
                        this.instance.position.set(tile.x, 0, tile.y);
                        this.instance.scale.set(scale, scale, scale);
                        this.instance.rotation.y = Math.random() * Math.PI; // Optionally, rotate the instances
                        this.instances.push(this.instance.clone());
                    }
                });

                // this.treeInstanceMesh.instanceMatrix.needsUpdate = true;
                scene.add(this.treeInstanceMesh[i]);
            }

            this.modelsLoaded = true;
        });

        this.tiles.forEach(tile => {
            this.tiles[this.tiles.indexOf(tile)] = new Tile(tile.x, tile.y, tile.fire, tile.type);
        });
    }

    // Return the tile at the given position
    getTileAtPosition (x, y) {
        return this.tiles.find(tile => tile.x === x && tile.y === y);
    }

    updateBoard (tilesToUpdate) {
        tilesToUpdate.forEach(tileToUpdate => {
            const index = tileToUpdate[0];
            this.tiles[index].hide();
            this.tiles[index] = null;
            this.tiles[index] = new Tile(tileToUpdate[1].x, tileToUpdate[1].y, tileToUpdate[1].fire, tileToUpdate[1].type);
            this.tiles[index].updateDisplay();
        });
    }

    hideBoard () {
        this.tiles.forEach(tile => {
            tile.hide();
        });
    }
}
