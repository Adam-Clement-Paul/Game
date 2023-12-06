import server from "bunrest";

const degreesToRadians = (degrees) => {
    return degrees * Math.PI / 180;
}

const radiansToDegrees = (radians) => {
    return radians * 180 / Math.PI;
}

export class Player {
    constructor (name, board, ws) {
        this.name = name;
        this.x = 4;
        this.y = 0;
        this.board = board;
        this.ws = ws;

        this.playerDirection = 0;

        // These values are constants
        this.speed = 0.04;
        this.friction_factor = 0.85;
        this.min_velocity = 0.0001;
        this.distance_to_collision = 0.6;

        // These values change over time
        this.velocity = {
            x: 0,
            y: 0
        }
        this.angularVelocity = 0;

        this.collisionWithTiles = false;

        // Booleans to track which keys are currently pressed
        this.keys = {
            z: false,
            s: false,
            q: false,
            d: false,
        };


            this.update();



    }

    onDocumentClickExtinguishFire () {
        // Get the direction of the player
        let {frontTile, tile, offsetX, offsetY} = this.getFrontTile(this.playerDirection);

        /*
        // Get the 4 tiles around the front tile
        const adjacentTiles = [
            frontTile,
            this.game.getBoard().getTileAt(frontTile.x + 1, frontTile.y),
            this.game.getBoard().getTileAt(frontTile.x - 1, frontTile.y),
            this.game.getBoard().getTileAt(frontTile.x, frontTile.y + 1),
            this.game.getBoard().getTileAt(frontTile.x, frontTile.y - 1),
        ];
        */

        const adjacentTiles = [frontTile];

        if (offsetX !== 0 && offsetY !== 0) {
            // Get the 2 tiles on the sides of the front tile, like an L
            adjacentTiles.push(this.board.getTileAtPosition(tile.x + offsetX, tile.y));
            adjacentTiles.push(this.board.getTileAtPosition(tile.x, tile.y + offsetY));
        } else if (offsetX === 0) {
            // Get the 2 tiles on the Z / -Z sides of the player, like a T
            adjacentTiles.push(this.board.getTileAtPosition(tile.x + offsetX - 1, tile.y + offsetY));
            adjacentTiles.push(this.board.getTileAtPosition(tile.x + offsetX + 1, tile.y + offsetY));
        } else if (offsetY === 0) {
            // Get the 2 tiles on the X / -X sides of the player, like a T
            adjacentTiles.push(this.board.getTileAtPosition(tile.x + offsetX, tile.y + offsetY - 1));
            adjacentTiles.push(this.board.getTileAtPosition(tile.x + offsetX, tile.y + offsetY + 1));
        }

        // For each tile, extinguish the fire
        adjacentTiles.forEach(tile => {
            if (tile) {
                tile.extinguishFire();
            }
        });
    }

    // Axe
    onDocumentRightClick () {
        // Get the tile in front of the player
        let {frontTile} = this.getFrontTile(this.playerDirection);

        if (frontTile.type === "tree" && frontTile.fire === 0) {
            frontTile.destroyTree();
        }
    }

    // Check if the player is colliding with a tile of a type other than "grass" at the position of the player
    checkCollisionWithTiles (x, y) {
        for (const tile of this.board.tiles) {
            if (tile.type !== "grass" &&
                Math.abs(tile.x - x) < this.distance_to_collision &&
                Math.abs(tile.y - y) < this.distance_to_collision
            ) {
                return true; // Collision with a tile, movement is forbidden.
            }
        }
        return false; // No collision with a tile, movement is allowed.
    }


    changeTargetRotation (targetRotation) {
        if (this.keys.z) targetRotation = 0;
        if (this.keys.s) targetRotation = Math.PI;
        if (this.keys.q) targetRotation = Math.PI / 2;
        if (this.keys.d) targetRotation = -Math.PI / 2;

        if (this.keys.z && this.keys.q) targetRotation = Math.PI / 4;
        if (this.keys.z && this.keys.d) targetRotation = -Math.PI / 4;
        if (this.keys.s && this.keys.q) targetRotation = Math.PI * 3 / 4;
        if (this.keys.s && this.keys.d) targetRotation = -Math.PI * 3 / 4;
        return targetRotation;
    }

    // Updates the player rotation with inertia
    rotationWithInertia () {
        let targetRotation = this.changeTargetRotation(this.playerDirection);

        const currentRotationDegrees = radiansToDegrees(this.playerDirection);
        const targetRotationDegrees = radiansToDegrees(targetRotation);

        let angleDiff = ((targetRotationDegrees - currentRotationDegrees) + 180) % 360 - 180;
        if (angleDiff < -180) angleDiff += 360;

        this.playerDirection += degreesToRadians(angleDiff) * 0.1;
        this.setRotation(this.playerDirection);
    }

    movementsAndCollisions () {
        /*if (this.velocity.x !== 0 || this.velocity.y !== 0) {
            let desiredX = this.x + this.velocity.x;
            let desiredY = this.y + this.velocity.y;

            // True: collision detected, False: no collision detected
            let collisionDetected = this.checkCollisionWithTiles(desiredX, desiredY);

            if (collisionDetected) {
                // Check if the player can move in the desired direction
                if (!this.checkCollisionWithTiles(desiredX, this.y)) {
                    this.x = desiredX;
                } else if (!this.checkCollisionWithTiles(this.x, desiredY)) {
                    this.y = desiredY;
                }
            } else {
                */
                // If no collision is detected, move in the desired direction
                this.x += this.velocity.x;
                this.y += this.velocity.y;
            //}
       // }
    }

    movementsWithInertia () {
        if (this.keys.z || this.keys.s || this.keys.q || this.keys.d) {
            this.velocity.x = this.speed * Math.sin(this.playerDirection);
            this.velocity.y = this.speed * Math.cos(this.playerDirection);
        }

        this.movementsAndCollisions();

        // Reduce velocity and angular velocity (simulate friction)
        this.velocity.x *= this.friction_factor;
        this.velocity.y *= this.friction_factor;
        this.angularVelocity *= this.friction_factor;

        // Minimum velocity threshold to avoid excessive deceleration
        if (Math.abs(this.velocity.x) < this.min_velocity) this.velocity.x = 0;
        if (Math.abs(this.velocity.y) < this.min_velocity) this.velocity.y = 0;
        if (Math.abs(this.angularVelocity) < this.min_velocity) this.angularVelocity = 0;

        this.setPosition(this.x, 1, this.y);
    }

    update () {
        this.rotationWithInertia();

        this.movementsWithInertia();

        console.log(this.x, this.y)

        setTimeout(() => {
            this.update();
        }, 1000); // 30 FPS
    }

    getPosition () {
        return {
            x: this.x,
            y: this.y,
        }
    }

    setPosition (x, y) {
        this.x = x;
        this.y = y;

        // send to the frontend
        if (this.ws && this.ws.send) {
            this.ws.send(JSON.stringify({
                type: "moveClient",
                player: this.name,
                position: { x: this.x, y: this.y },
            }));
        }
    }

    getRotation () {
        return this.playerDirection;
    }

    setRotation (rotation) {
        this.playerDirection = rotation;

        // send to the frontend
        if (this.ws && this.ws.send) {
            // Send rotation to the frontend
            this.ws.send(JSON.stringify({
                type: "rotateClient",
                player: this.name,
                rotation: this.playerDirection,
            }));
        }
    }

    setAction (action) {
        // this.model.action = action;
    }

    setKeys (keys) {
        this.keys = keys;
    }
}
