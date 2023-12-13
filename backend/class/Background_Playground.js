import {Truck} from './Background_Truck.js';

export class Playground {
    constructor () {
        this.truckList = [];
    }

    addTruck(id, name, model) {
         this.truckList.push(new Camion(id, name, model, 0, 0, 0, 0));
    }

    update() {

    }
}
