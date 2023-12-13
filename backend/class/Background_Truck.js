export class Truck {
    static truckSize = { w: 3.5, h: 3, l: 8 };

    constructor (id, name, model, x, y, z, rotation) {
        this.id = id;
        this.name = name;
        this.model = model;
        this.x = x;
        this.y = y;
        this.z = z;

        this.updateAll();
    }

    respawn () {

    }

    updateAll () {
        setTimeout((this.update.bind(this)), 1000 / 60);

        if (this.active) {
            this.cameraMovements(this.vehicle.chassisBody.position.x, this.vehicle.chassisBody.position.z);
        }
    }
}
