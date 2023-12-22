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
let sessions: { [key: string]: any } = {};

const server = Bun.serve<WebSocketData>({
    port: process.env.PORT_GAME,
    async fetch(request, server) {
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
            const gameId = pathname.split('/')[1].toLowerCase();
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

        // Get data from the user_api microservice
        if (pathname === '/api/game' && method === 'POST') {
            // @ts-ignore
            const json = await Bun.readableStreamToJSON(request.body);
            const email = json.email;
            const token = json.token;
            const gameId = json.gameId;

            const sessionId = generateUniqueSessionId();

            const response = await fetch(`http://164.81.228.233:1000/api/users/`, {
                method: "POST",
                body: JSON.stringify({
                    email: email,
                    token: token
                }),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la requête POST');
            }

            const data = await response.json();
            const id = data.userData.id;
            const username = data.userData.username;

            sessions[sessionId] = {
                gameId: gameId,
                id: id,
                username: username
            };

            return new Response(JSON.stringify({sessionId}), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-control-allow-origin': '*',
                },
            });
        }

        // Route to join the websocket room
        if (pathname.startsWith('/websocket')) {
            const gameId = pathname.split('/')[2];
            const sessionId = pathname.split('/')[3];

            let id, username;
            if (sessions[sessionId]) {
                id = sessions[sessionId].id;
                username = sessions[sessionId].username;
            } else {
                return new Response('Invalid session id', { status: 400 });
            }

            // Connexion WebSocket
            const color = parseInt(`0x${Math.floor(Math.random() * 16777215)}`, 16);
            const success = server.upgrade(request, {
                data: {
                    createAt: Date.now(),
                    gameId: gameId,
                    authToken: id,
                    name: username,
                    color: color,
                },
            });

            if (!success) {
                throw new Error('Erreur lors de la connexion WebSocket');
            }
            console.log('Server upgraded to websocket');

            // Ajouter le joueur à la partie
            games[gameId].addPlayer(id, username, color);
            if (Object.keys(games[gameId].players).length === 1) {
                games[gameId].owner = id;
            }
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
                playerId: ws.data.authToken
            });

            ws.publish(ws.data.gameId, newPlayerData);
        },
        message(ws, message) {
            let jsonMessage;
            if (typeof message === 'string') {
                jsonMessage = JSON.parse(message);
            }

            if (jsonMessage.type === 'requestStartGame' && games[ws.data.gameId].owner === ws.data.authToken) {
                console.log('starting game');
                for (const player in games[ws.data.gameId].players) {
                    games[ws.data.gameId].players[player].x = 4;
                    games[ws.data.gameId].players[player].y = 3;
                    games[ws.data.gameId].players[player].z = null;
                }
                games[ws.data.gameId].startedAt = Date.now();
                const msg = JSON.stringify({
                    type: 'startGame',
                    players: games[ws.data.gameId].players
                });
                server.publish(ws.data.gameId, msg);
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
                games[ws.data.gameId].updatePlayer(jsonMessage.player, jsonMessage.x, jsonMessage.y, jsonMessage.z, jsonMessage.rotation);
            }
            if (jsonMessage.type === 'moveTruck') {
                // Update player position and rotation on the server
                // games[ws.data.gameId].updateTruck(jsonMessage.player, jsonMessage.x, jsonMessage.y, jsonMessage.z, jsonMessage.rotation);
            }
        },
        close(ws) {
            console.log('closing');
            games[ws.data.gameId].removePlayer(ws.data.authToken);

            const msg = JSON.stringify({
                type: 'removePlayer',
                playerId: ws.data.authToken,
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
            z: currentPlayer.z,
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

// Fonction pour générer un identifiant de session unique
function generateUniqueSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Fonction pour extraire l'identifiant de session du header de la requête WebSocket
function extractSessionIdFromWebSocketRequest(request: Request) {
    const cookies = request.headers.get('Cookie');
    if (!cookies) {
        throw new Error('Cookie not found in WebSocket request');
    }

    const sessionIdMatch = cookies.match(/sessionId=([^;]+)/);
    if (!sessionIdMatch) {
        throw new Error('sessionId not found in cookies');
    }

    return sessionIdMatch[1];
}

