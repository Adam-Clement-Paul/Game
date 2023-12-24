import gsap from 'gsap';
import {camera} from '../script_modules/init3DScene';

export class Player {
    constructor (id, name, x, y, z, rotation, socket, active) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.z = z;
        this.rotation = rotation;

        this.socket = socket;
        this.active = active;

        this.timer = 0;
    }

    // Updates the camera position and lookAt
    cameraMovements (x, y, scale, time = 0.1) {
        let tl = gsap.timeline();
        tl.to(camera.position, {
            duration: time,
            x: x,
            y: 3 * scale,
            z: y - 2 * scale
        });
        camera.lookAt(x, 0, y);
    }

    updatePosition (x, y, z, rotation) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.rotation = rotation;

        console.log(`Update position of (${this.id}) to (${this.x}, ${this.y}, ${this.z})`);
    }

    sendPosition (type) {
        this.socket.send(JSON.stringify({
            type: type,
            player: this.id,
            x: this.x,
            y: this.y,
            z: this.z,
            rotation: this.rotation
        }));
        this.timer = setTimeout((this.sendPosition.bind(this)), 1000 / 60, type);
    }
}