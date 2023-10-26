export class Collision {
    constructor(player, board) {
        this.player = player;
        this.board = board;
    }

    // Détection de collision entre deux AABB
    detectAABBCollision(box1, box2) {
        return !(
            box2.x + box2.w < box1.x ||
            box2.x > box1.x + box1.w ||
            box2.y + box2.h < box1.y ||
            box2.y > box1.y + box1.h
        );
    }


    resolveCollisions() {
        const playerBox = {
            x: this.player.x,
            y: this.player.y,
            w: this.player.cube.geometry.parameters.width,
            h: this.player.cube.geometry.parameters.depth,
        };

        for (const tile of this.board.tiles) {
            if (tile.type !== "grass") {
                const tileBox = {
                    x: tile.x,
                    y: tile.y,
                    w: tile.width,
                    h: tile.height,
                };

                if (this.detectAABBCollision(playerBox, tileBox)) {
                    // Collision détectée avec cette tuile, vous pouvez gérer la collision ici
                    // Par exemple, arrêter le mouvement du joueur ou effectuer une autre action
                    // Si vous souhaitez bloquer complètement le mouvement, vous pouvez ne rien faire ici.

                    // Mettre à jour les coordonnées de la tuile du joueur pour éviter la collision
                    this.player.x = this.player.previousX; // Revenir à la position précédente en X
                    this.player.y = this.player.previousY; // Revenir à la position précédente en Y
                    this.player.cube.position.set(
                        this.player.x,
                        this.player.cube.geometry.parameters.height / 2,
                        this.player.y
                    );
                }
            }
        }
    }
}
