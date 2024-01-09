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

        let nbrObstacle = 0;
        this.tiles.forEach(tile => {
            if (tile.type === 'border') {
                nbrObstacle++;
            }
        });
        console.log(nbrObstacle);


        /*loadModel('./models/tree.glb', (model) => {
            this.tree = model;
            this.tree.scale.set(scale, scale, scale);
            this.tree.position.set(3, 0, 2);
            scene.add(this.tree);
        });*/

        let instance = new THREE.Object3D();
        loadModel('./models/treeBorder.glb', (model) => {
            const geometry = model.children[0].geometry;
            const material = model.children[0].material;
            this.treeInstanceMesh = new THREE.InstancedMesh(geometry, material, nbrObstacle);
            this.treeInstanceMesh.position.set(0, 0, 0);
            this.treeInstanceMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            this.tiles.forEach((tile) => {
                if (tile.type === 'border') {
                    instance.position.set(tile.x, 0, tile.y);
                    instance.scale.set(scale, scale, scale);
                    instance.rotation.y = Math.random() * Math.PI;
                    this.instances.push(instance.clone());
                    this.tiles[this.tiles.indexOf(tile)] = new Tile(tile.x, tile.y, tile.fire, tile.type);
                }
            });

            this.treeInstanceMesh.instanceMatrix.needsUpdate = true;
            scene.add(this.treeInstanceMesh);

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
            /*
            if (this.tiles[index].type === 'tree' && tileToUpdate[1].type !== 'tree') {
                for (let i = 0; i < 2; i++) {
                    this.tiles[index].hide(true, this.treeInstanceMesh);
                }
            } else {
                this.tiles[index].hide(false);
            }*/
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

    suppressInstances () {
        this.modelsLoaded = null;

        this.treeInstanceMesh.instanceMatrix.needsUpdate = false;
        this.treeInstanceMesh.dispose();
        // this.treeInstanceMesh = null;
    }
}
