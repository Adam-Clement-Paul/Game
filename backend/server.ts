import {file} from "bun";

import {Game} from "./class/Background_Game.js";


const BASE_PATH = "../frontend/dist";
const domain = "http://localhost";


// Store created games and their IDs
const games: { [key: string]: any } = {};

// Define the data type for the WebSocket
type WebSocketData = {
    createdAt: number;
    gameId: string;
    authToken: string;
};


const server = Bun.serve<WebSocketData>({
    port: 3010,
    fetch(request, server) {
        const {url, method} = request;
        const {pathname} = new URL(url);

        // Landing page
        if (pathname === "/") {
            const indexPath = BASE_PATH + "/createJoinGame.html";
            const response = new Response(file(indexPath));
            response.headers.set("Cache-Control", "public, max-age=3600");
            return response;
        }

        // Allow other files to be served (static files) and
        // check all routes for games: at localhost/GAME_ID
        if (pathname.startsWith("/") && method === "GET" && pathname.split("/").length === 2) {
            // Extract game ID from the URL
            const gameId = pathname.split("/")[1];
            const gameFound = games[gameId];

            if (gameFound) {
                // Serve the game page
                const response = new Response(file(BASE_PATH + "/index.html"));
                response.headers.set("Cache-Control", "public, max-age=3600");
                return response;
            }
        }

        // Give the game data to the frontend
        if (pathname.startsWith("/api/game/data/") && method === "GET") {
            // Extract game ID from the URL
            const gameId = pathname.split("/")[4];
            const gameFound = games[gameId];

            if (gameFound) {
                // Returns game data including board and players (Background_Game.js)
                return new Response(JSON.stringify({game: gameFound}), {
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
            // Store a new game instance with its ID
            games[gameId] = new Game();

            const redirectUrl = `${domain}:${server.port}/${gameId}`;

            // Return the redirect URL in the response
            return new Response(JSON.stringify({redirectUrl}), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-control-allow-origin": "*",
                },
            });
        }

        // Route to join the websocket room
        if (pathname.startsWith("/websocket")) {
            const gameId = pathname.split("/")[2];
            const cookie = "Paul";
            // Upgrade the request to a websocket
            const success = server.upgrade(request, {
                data: {
                    createAt: Date.now(),
                    gameId: gameId,
                    authToken: cookie,
                },
            });

            if (success) {
                console.log("Server upgraded to websocket");
                return;
            }
            return new Response("WebSocket upgrade error", {status: 500});
        }

        // Serve static files
        const filePath = BASE_PATH + pathname;

        const response = new Response(file(filePath));
        response.headers.set("Cache-Control", "public, max-age=3600");
        return response;

    },
    websocket: {
        open(ws) {
            console.log("openning in game n°" + ws.data.gameId);
            const msg = `${ws.data.authToken} has joined the chat`;
            // Join the game
            ws.subscribe(ws.data.gameId);
            ws.publish(ws.data.gameId, msg);
        },
        message(ws, message) {
            console.log("messaging");
            ws.send(`Server received your message: ${message}`);

            let jsonMessage;
            if (typeof message === "string") {
                jsonMessage = JSON.parse(message);
            }

            if (jsonMessage.type === "extinguish") {
                // TODO: extinguish the fire
            }
            if (jsonMessage.type === "axe") {
                // TODO: cut a tree
            }
        },
        close(ws) {
            console.log("closing");
            const msg = `${ws.data.authToken} has left the game`;
            ws.unsubscribe(ws.data.gameId);
            ws.publish(ws.data.gameId, msg);
        },
    },
    error(error) {
        console.log(error);
        if (error.errno === -2) {
            // TODO: redirect to 404 page
            return new Response("Not Found", {status: 404});
        }
        return new Response(null, {status: 500});
    },
});

console.log(`Server running on port ${server.port}`);
