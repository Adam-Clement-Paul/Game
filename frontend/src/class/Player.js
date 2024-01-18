import gsap from 'gsap';
import {camera} from '../script_modules/init3DScene';

/**
 * Player class
 * @class Player
 * @param {string} id - The player id
 * @param {string} name - The player name
 * @param {number} x - The player x position
 * @param {number} y - The player y position
 * @param {number} z - The player z position
 * @param {number} rotation - The player rotation
 * @param {object} socket - The player socket
 * @param {boolean} active - Boolean to know if the player is active or not
 * @param {number} timer - The timer to send the position
 */

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

    stopMoving () {
        clearTimeout(this.timer);
    }
}