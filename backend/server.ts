// Dependencies
import {file} from "bun";

// @ts-ignore
import {Game} from "./class/BackGame.js";
import url from "url";
import querystring from "querystring";

const BASE_PATH = "../frontend/dist";

// Store created games and their IDs
const games = {};
let keys: { [x: string]: any; };
let keyArray: boolean[];

type WebSocketData = {
    createdAt: number;
    gameId: string;
    authToken: string;
};

// Create server
// @ts-ignore
const server = Bun.serve<WebSocketData>({
    port: 3010,
    fetch(request, server) {
        const {url, method} = request;
        const {pathname} = new URL(url);

        if (pathname.startsWith("/websocket")) {
            const gameId = pathname.split("/")[2];
            const cookie = "Paul";
            // @ts-ignore
            games[gameId].setPlayer(cookie, server.websocket);
            const success = server.upgrade(request, {
                data: {
                    createAt: Date.now(),
                    gameId: gameId,
                    authToken: cookie,
                },
            });
            if (success) {
                console.log("server upgraded to websocket");
                return;
            }
            return new Response("WebSocket upgrade error", {status: 400});
        }

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
                const response = new Response(file(BASE_PATH + "/index.html"));
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

        // Separate route to get the game data
        if (pathname.startsWith("/api/game/data/") && method === "GET") {
            const gameId = pathname.split("/")[4]; // Extract game ID from the URL
            // @ts-ignore
            const game = games[gameId];

            // If the game exists in the game list
            if (game) {
                // Get the game class and the game data
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

            // Store a new game instance with its ID
            // @ts-ignore
            games[gameId] = new Game();

            // Build the redirect URL
            // @ts-ignore
            const redirectUrl = `http://localhost:${server.port}/${gameId}`;

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
    websocket: {
        open(ws) {
            console.log("openning in game n°" + ws.data.gameId);
            const msg = `${ws.data.authToken} has joined the chat`;
            // Join the game
            ws.subscribe(ws.data.gameId);
            ws.publish(ws.data.gameId, msg);
        },
        message(ws, message) {
            let jsonMessage;
            if (typeof message === "string") {
                jsonMessage = JSON.parse(message);
            }
            if (jsonMessage.type === "move") {
                keys = jsonMessage.keys;

                keyArray = Object.values(keys);

                // z
                // @ts-ignore
                games[ws.data.gameId].players[0].keys.z = keyArray[0];

                // q
                // @ts-ignore
                games[ws.data.gameId].players[0].keys.q = keyArray[1];

                // s
                // @ts-ignore
                games[ws.data.gameId].players[0].keys.s = keyArray[2];

                // d
                // @ts-ignore
                games[ws.data.gameId].players[0].keys.d = keyArray[3];
            }

            console.log("messaging");
            // TODO: Receive the input from the client and update the game state
            ws.send(`Server received your message: ${message}`);
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
            return new Response("Not Found", {status: 404});
        }
        return new Response(null, {status: 500});
    },
});

console.log(`Server running on port ${server.port}`);

const getUsernameFromReq = (req: any) => {
    const parsedUrl: any = url.parse(req.url);
    const queryParams = querystring.parse(parsedUrl.query);
    return queryParams;
}
