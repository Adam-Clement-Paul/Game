import gsap from 'gsap';
import {camera} from "../script_modules/init3DScene";

export class Identity {
    constructor (id, x, y, z, rotation, socket, active = false) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.z = z;
        this.rotation = rotation;

        this.socket = socket;
        this.active = active;

        this.timer = 0;
    }

    setActive () {
        this.active = true;
    }

    // Updates the camera position and lookAt


    stopUpdate () {
        clearTimeout(this.timer);
    }

    sendPosition (type) {
        this.socket.send(JSON.stringify({
            type: type,
            player: this.id,
            x: this.x,
            y: this.y,
            z: this.z,
            rotation: this.rotation,
        }));
        setTimeout((this.sendPosition.bind(this)), 1000 / 60);
    }

    updatePosition (x, y, z, rotation) {

    }
}