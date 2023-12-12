import {file} from 'bun';

import {Game} from './class/Background_Game.js';

const BASE_PATH = "../frontend/dist";
const domain = `http://${process.env.HOST}`;

// Store created games and their IDs
const games: { [key: string]: any } = {};

// Define the data type for the WebSocket
type WebSocketData = {
    createdAt: number;
    gameId: string;
    authToken: string;
    name: string;
    color: number;
};


const server = Bun.serve<WebSocketData>({
    port: process.env.PORT_GAME,
    fetch(request, server) {
        const {url, method} = request;
        const {pathname} = new URL(url);

        // Landing page
        if (pathname === '/') {
            const indexPath = BASE_PATH + '/createJoinGame.html';
            const response = new Response(file(indexPath));
            response.headers.set('Cache-Control', 'public, max-age=3600');
            return response;
        }

        // Check all routes for games: at localhost/GAME_ID
        if (pathname.startsWith('/') && method === 'GET' && pathname.split('/').length === 2) {
            // Extract game ID from the URL
            const gameId = pathname.split('/')[1];
            const gameFound = games[gameId];

            if (gameFound) {
                // Serve the game page
                const response = new Response(file(BASE_PATH + '/index.html'));
                response.headers.set('Cache-Control', 'public, max-age=3600');
                return response;
            }
        }

        // Give the game data to the frontend
        if (pathname.startsWith('/api/game/data/') && method === 'GET') {
            // Extract game ID from the URL
            const gameId = pathname.split('/')[4];
            const gameFound = games[gameId];

            if (gameFound) {
                // Returns game data including board and players (Background_Game.js)
                return new Response(JSON.stringify({game: gameFound}), {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-control-allow-origin': '*',
                    },
                });

            } else {
                return new Response('Game not found', {
                    status: 404,
                    headers: {
                        'Content-Type': 'text/plain',
                        'Access-control-allow-origin': '*',
                    },
                });
            }
        }

        // Create the room
        if (pathname === '/api/game' && method === 'GET') {
            // Generate a random game ID
            const gameId = Math.random().toString(36).substring(7);
            // Store a new game instance with its ID
            games[gameId] = new Game();

            const redirectUrl = `${domain}:${server.port}/${gameId}`;

            // Return the redirect URL in the response
            return new Response(JSON.stringify({redirectUrl}), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-control-allow-origin': '*',
                },
            });
        }

        // Route to join the websocket room
        if (pathname.startsWith('/websocket')) {
            // TODO: Extract the token sended by the client to identify the player

            const gameId = pathname.split('/')[2];

            // TODO: Get the name of the player from the cookie
            const cookie = `Paul${Math.random().toString(36).substring(2)}`;
            const token = Math.random().toString(36).substring(2, 12);

            // TODO: Get the skin of the player with a request to the database
            // Colors begin with 0x
            const color = parseInt(`0x${Math.floor(Math.random() * 16777215)}`, 16);

            // If the player is already in the game, do not upgrade the request
            for (const player in games[gameId].players) {
                if (games[gameId].players[player].name === cookie) {
                    return;
                }
            }

            // Upgrade the request to a websocket
            const success = server.upgrade(request, {
                data: {
                    createAt: Date.now(),
                    gameId: gameId,
                    authToken: token,
                    name: cookie,
                    color: color,
                },
            });

            if (success) {
                // TODO: Request the Mr Portail API to get
                console.log('Server upgraded to websocket');
                games[gameId].addPlayer(token, cookie, color);
                return;
            }
            return new Response('WebSocket upgrade error', {status: 500});
        }

        // Serve static files
        const filePath = BASE_PATH + pathname;

        const response = new Response(file(filePath));
        response.headers.set('Cache-Control', 'public, max-age=3600');
        return response;

    },
    websocket: {
        open(ws) {
            for (const player in games[ws.data.gameId].players) {
                if (games[ws.data.gameId].players[player].id === ws.data.authToken) {
                    ws.close(403, 'Player already in game');
                    return;
                }
            }
            console.log('openning in game n°' + ws.data.gameId);

            // Join the game
            ws.subscribe(ws.data.gameId);

            const newPlayerData = JSON.stringify({
                type: 'addPlayer',
                name: ws.data.name,
                color: ws.data.color,
                playerId: ws.data.authToken,
            });

            ws.publish(ws.data.gameId, newPlayerData);
        },
        message(ws, message) {
            let jsonMessage;
            if (typeof message === 'string') {
                jsonMessage = JSON.parse(message);
            }

            let tilesToUpdate: any[] = [];

            if (jsonMessage.type === 'extinguish' || jsonMessage.type === 'axe') {
                for (const playerKey in games[ws.data.gameId].players) {
                    const player = games[ws.data.gameId].players[playerKey];

                    if (player.id === jsonMessage.id) {
                        let updatedTiles = [];

                        if (jsonMessage.type === 'extinguish') {
                            updatedTiles = player.onDocumentClickExtinguishFire();
                        } else if (jsonMessage.type === 'axe') {
                            updatedTiles = player.onDocumentRightClick();
                        }

                        updatedTiles.forEach((tile: any) => {
                            tilesToUpdate.push(tile);
                        });

                        break; // Only one player can perform an action in one message
                    }
                }
                console.log(tilesToUpdate);
            }


            if (jsonMessage.type === 'move') {
                // Update player position and rotation on the server
                games[ws.data.gameId].updatePlayer(jsonMessage.player, jsonMessage.x, jsonMessage.y, jsonMessage.rotation);
            }
        },
        close(ws) {
            console.log('closing');
            games[ws.data.gameId].removePlayer(ws.data.authToken);

            const msg = JSON.stringify({
                type: 'removePlayer',
                playerId: ws.data.name,
            });
            ws.unsubscribe(ws.data.gameId);
            server.publish(ws.data.gameId, msg);
        },
    },
    error(error) {
        console.log(error);
        if (error.errno === -2) {
            // TODO: redirect to 404 page
            return new Response('Not Found', {status: 404});
        }
        return new Response(null, {status: 500});
    },
});

function sendPlayerPositionRotation(gameId: string) {
    const playerData = {};

    // Collect player positions and rotations
    for (const player in games[gameId].players) {
        const currentPlayer = games[gameId].players[player];
        // @ts-ignore
        playerData[player] = {
            x: currentPlayer.x,
            y: currentPlayer.y,
            rotation: currentPlayer.rotation,
        };
    }

    // Send data to all clients
    const broadcastData = {
        type: 'updatePlayers',
        players: playerData,
    };

    server.publish(gameId, JSON.stringify(broadcastData));
}

setInterval(() => {
    for (const gameId in games) {
        sendPlayerPositionRotation(gameId);
    }
}, 1000 / 60); // Adjust the frequency of the updates

console.log(`Server running on port ${server.port}`);
