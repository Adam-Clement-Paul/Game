export class Player {
    constructor (id, name, color, x, y, rotation, board) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.board = board;
    }

    // FireHose
    onDocumentClickExtinguishFire (playerDirection) {
        // Get the direction of the player
        let { frontTile, tile, offsetX, offsetY } = this.getFrontTile(playerDirection);

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
    onDocumentRightClick (event) {
        event.preventDefault();

        // Get the tile in front of the player
        let { frontTile } = this.getFrontTile(this.playerDirection);

        if (frontTile.type === "tree" && frontTile.fire === 0) {
            frontTile.destroyTree();
        }
    }

    getFrontTile (playerDirection) {
        // Get the tile on which the player is standing
        const tile = this.board.getTileAtPosition(Math.round(this.x), Math.round(this.y));
        if (!tile) {
            return;
        }

        // Get the tile in front of the player
        const offsetX = Math.round(Math.sin(playerDirection));
        const offsetY = Math.round(Math.cos(playerDirection));

        const frontTile = this.board.getTileAtPosition(tile.x + offsetX, tile.y + offsetY);
        if (!frontTile) {
            return;
        }
        return { frontTile, tile, offsetX, offsetY };
    }

    updateAll (x, y, direction) {
        this.setPosition(x, y);
        this.setRotation(direction);
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
    }

    getRotation () {
        return this.rotation;
    }

    setRotation (rotation) {
        this.rotation = rotation;
    }

    setAction (action) {
        // this.model.action = action;
    }

    setKeys (keys) {
        this.keys = keys;
    }
}
