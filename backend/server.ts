import {file} from 'bun';
import {Game} from './class/Background_Game.js';

const BASE_PATH = "../frontend/dist";
const domain = `http://${process.env.HOST}`;
import {readFileSync} from 'fs';

// Store created games and their IDs
const games: { [key: string]: any } = {};

// Default ID skins for players who cheat with their skins
const defaultSkins = {
    backpack: '6585ccd27a15450c53353c5b',
    fighter: '6585cca17a15450c53353c57',
    truck: '6585cc887a15450c53353c53'
}

// Define the data type for the WebSocket
type WebSocketData = {
    createdAt: number;
    gameId: string;
    authToken: string;
    name: string;
    models: object;
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
            // Vérifie toutes les 10 secondes s'il y a des joueurs dans la partie, sinon la supprime
            games[gameId].loopIsEmpty = setInterval(() => {
                if (Object.keys(games[gameId].players).length === 0 && games.hasOwnProperty(gameId)) {
                    console.log('game deleted', gameId);
                    games[gameId].reset();
                    clearInterval(games[gameId].loopIsEmpty);
                    delete games[gameId];
                }
            }, 10000);

            const redirectUrl = `${domain}/${gameId}`;

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
            let backpack = json.backpack;
            let firefighter = json.fighter;
            let truck = json.truck;

            const sessionId = generateUniqueSessionId();

            const response = await fetch(`https://${process.env.IP}:1000/api/users/`, {
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
                throw new Error('Error: POST MrPortail:1000/api/users/ (email, token)');
            }

            const data = await response.json();
            const id = data.userData.id;
            const username = data.userData.username;

            const backpackList: Array<string> = [];
            if (data.dataInventory.backpack) {
                data.dataInventory.backpack.forEach((item: any) => {
                    backpackList.push(item.id);
                });
            }

            const firefighterList: Array<string> = [];
            if (data.dataInventory.fighter) {
                data.dataInventory.fighter.forEach((item: any) => {
                    firefighterList.push(item.id);
                });
            }

            const truckList: Array<string> = [];
            if (data.dataInventory.truck) {
                data.dataInventory.truck.forEach((item: any) => {
                    truckList.push(item.id);
                });
            }

            if (!backpackList.includes(backpack)) {
                backpack = defaultSkins.backpack;
            }

            if (!firefighterList.includes(firefighter)) {
                firefighter = defaultSkins.fighter;
            }

            if (!truckList.includes(truck)) {
                truck = defaultSkins.truck;
            }

            sessions[sessionId] = {
                gameId: gameId,
                id: id,
                username: username,
                backpack: backpack,
                firefighter: firefighter,
                truck: truck
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
        // Doesn't wait response so errors can't be handled here
        if (pathname.startsWith('/websocket')) {
            const gameId = pathname.split('/')[2];
            const sessionId = pathname.split('/')[3];

            if (!games[gameId]) {
                return;
            }

            let id, username, backpack, firefighter, truck;
            if (sessions[sessionId]) {
                id = sessions[sessionId].id;
                username = sessions[sessionId].username;
                backpack = sessions[sessionId].backpack;
                firefighter = sessions[sessionId].firefighter;
                truck = sessions[sessionId].truck;
            } else {
                return;
            }

            // Connexion WebSocket
            const models = {
                truck: truck,
                firefighter: firefighter,
                backpack: backpack
            }
            const success = server.upgrade(request, {
                data: {
                    createAt: Date.now(),
                    gameId: gameId,
                    authToken: id,
                    name: username,
                    models: models,
                },
            });

            if (!success) {
                return;
            }
            console.log('Server upgraded to websocket');

            // Ajouter le joueur à la partie
            games[gameId].addPlayer(id, username, models);
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
                models: ws.data.models,
                playerId: ws.data.authToken
            });

            ws.publish(ws.data.gameId, newPlayerData);
        },
        message(ws, message) {
            let jsonMessage;
            if (typeof message === 'string') {
                jsonMessage = JSON.parse(message);
            }
            if (!games[ws.data.gameId]?.players) {
                return;
            }

            if (jsonMessage.type === 'requestStartGame' && games[ws.data.gameId].owner === ws.data.authToken) {
                console.log('starting game');
                for (const player in games[ws.data.gameId].players) {
                    games[ws.data.gameId].players[player].x = 4;
                    games[ws.data.gameId].players[player].y = 3;
                    games[ws.data.gameId].players[player].z = null;
                }
                const msg = JSON.stringify({
                    type: 'startGame'
                });
                server.publish(ws.data.gameId, msg);
                // Start the game
                setTimeout(() => {
                    if (games[ws.data.gameId]) {
                        games[ws.data.gameId].start(server, ws.data.gameId);
                    }
                }, 3000);
            }

            let tilesToUpdate: any[] = [];
            if (jsonMessage.type === 'extinguish' || jsonMessage.type === 'axe') {
                for (const playerKey in games[ws.data.gameId].players) {
                    const player = games[ws.data.gameId].players[playerKey];

                    if (player.id === jsonMessage.id) {
                        let updatedTiles = [];

                        if (jsonMessage.type === 'extinguish') {
                            updatedTiles = player.onDocumentClickExtinguishFire();
                            player.extinguishedFlames += updatedTiles.length;
                        } else if (jsonMessage.type === 'axe') {
                            updatedTiles = player.onDocumentRightClick();
                            if (updatedTiles[0] && updatedTiles[0][1].type === 'grass') {
                                player.cutTrees += updatedTiles.length;
                            }
                        }

                        updatedTiles.forEach((tile: any) => {
                            tilesToUpdate.push(tile);
                        });

                        break; // Only one player can perform an action in one message
                    }
                }
                // Send data to all clients
                if (tilesToUpdate.length > 0) {
                    setTimeout(() => {
                        const broadcastData = {
                            type: 'updateTiles',
                            tiles: tilesToUpdate,
                        };

                        server.publish(ws.data.gameId, JSON.stringify(broadcastData));
                    }, 900);
                }
            }

            // Renvoi tel quels les messages de type 'axe' et 'extinguish' pour que les joueurs voient les animations
            if (jsonMessage.type === 'axe' || jsonMessage.type === 'extinguish') {
                const broadcastData = {
                    type: jsonMessage.type,
                    playerId: jsonMessage.id,
                };

                server.publish(ws.data.gameId, JSON.stringify(broadcastData));
            }


            if (jsonMessage.type === 'move') {
                // Update player position and rotation on the server
                games[ws.data.gameId].updatePlayer(jsonMessage.player, jsonMessage.x, jsonMessage.y, jsonMessage.z, jsonMessage.rotation);
            }
        },
        close(ws) {
            console.log('closing');
            if (!games[ws.data.gameId]) {
                ws.close(400, 'Wrong game ID');
                return;
            }
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
            // Affiche le contenu de la page 404.html
            return new Response(readFileSync(BASE_PATH + '/404.html'), {
                status: 404,
                headers: {
                    'Content-Type': 'text/html',
                    'Access-control-allow-origin': '*',
                },
            });
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
            id: currentPlayer.id,
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

