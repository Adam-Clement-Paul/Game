// Dependencies
import {file, serve, write} from "bun";

// @ts-ignore
import {Game} from "./class/BackGame.js";

const BASE_PATH = "../frontend/dist";

// Store created games and their IDs
const games = {};

// Create server
// @ts-ignore
const server = Bun.serve({
    port: 3010,
    async fetch(request) {
        const {url, method} = request;
        const {pathname} = new URL(url);

        // For static files
        if (pathname === "/") {
            const indexPath = BASE_PATH + "/createJoinGame.html";
            const response = new Response(file(indexPath));
            response.headers.set("Cache-Control", "public, max-age=3600");
            return response;
        }

        // Add a route for all games: at localhost:9000/GAME_ID
        if (pathname.startsWith("/") && method === "GET" && pathname.split("/").length === 2) {
            const gameId = pathname.split("/")[1]; // Extract game ID from the URL
            // @ts-ignore
            const game = games[gameId];

            if (game) {
                const filePath = BASE_PATH + "/index.html";
                const response = new Response(file(filePath));
                response.headers.set("Cache-Control", "public, max-age=3600");
                return response;
            } else {
                // Allow other files to be served
                const filePath = BASE_PATH + "/" + pathname.split("/")[1];
                const response = new Response(file(filePath));
                response.headers.set("Cache-Control", "public, max-age=3600");
                return response;
            }
        }

        // Route séparée pour obtenir les données du jeu
        if (pathname.startsWith("/api/gameData/") && method === "GET") {
            const gameId = pathname.split("/")[3]; // Extract game ID from the URL
            // @ts-ignore
            const game = games[gameId];

            if (game) {
                // Retournez à la fois la classe Game et les données du jeu
                return new Response(JSON.stringify({game: game}), {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-control-allow-origin": "*",
                    },
                });
            } else {
                return new Response("Game not found", {
                    status: 404,
                    headers: {
                        "Content-Type": "text/plain",
                        "Access-control-allow-origin": "*",
                    },
                });
            }
        }


        // Create the room
        if (pathname === "/api/game" && method === "GET") {
            // Generate a random game ID
            const gameId = Math.random().toString(36).substring(7);

            // Create a new game instance
            const newGame = new Game();

            // Store the game instance with its ID
            // @ts-ignore
            games[gameId] = newGame;

            // Build the redirect URL
            // @ts-ignore
            const redirectUrl = `http://localhost:${server.port}/${gameId}`;

            // Stocke le jeu dans le fichier games.json avec son ID gameID
            // @ts-ignore
            // write("./games.json", JSON.stringify(games), null, 2);

            // Return the redirect URL in the response
            return new Response(JSON.stringify({redirectUrl}), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-control-allow-origin": "*",
                },
            });
        }

        const filePath = BASE_PATH + pathname;

        const response = new Response(file(filePath));
        response.headers.set("Cache-Control", "public, max-age=3600");
        return response;

    },
    error(error) {
        console.log(error);
        if (error.errno === -2) {
            return new Response("Not Found", {status: 404});
        }
        return new Response(null, {status: 500});
    },
});
console.log(`Server running on port ${server.port}`);
