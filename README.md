# ThreeJS + Vite + BunJS = un jeu multijoueur 3D

## Comprendre le projet
Les fichiers du front-end sont dans le dossier `/frontend`. Ceux du back-end sont dans le dossier `/backend`.

Le serveur BunJS est créé dans le fichier `/backend/server.ts`. C'est à l'intérieur que, premièrement, les routes sont définies, et deuxièmement, que le websocket est géré.
Les classes associées au serveur sont dans le dossier `/backend/class`. 
Au moment de créer une nouvelle partie, le serveur crée une instance de la classe `Game`. Il la stocke dans un tableau, et lui attribue un ID. 
Cette classe contient le plateau de jeu et la liste des joueurs connectés à la partie.
Le plateau de jeu est une instance de la classe `Board`. `Board` permet de créer les tuiles aléatoirement. Chaque partie a son propre plateau de jeu.
Elle utilise `Section` pour créer des zones de jeu, puis des couloirs entre ces zones avec `Corridor`. Le spawn est une section particulière qui ne possède pas de feu, pas d'arbre en son centre et pas d'obstacle.
Les tuiles (`Tile`) sont placées et typées par `Section` et `Corridor`.

Les joueurs sont des instances de la classe `Player`. Ils sont stockés dans un tableau dans la classe `Game`.

Quand la partie est créée, le joueur est redirigé vers la page du jeu sur `game.pyrofighters.online/GAME_ID`. Sur cette page lui est servi les fichiers `/frontend/src/index.html` et `/frontend/src/script.js`.
Ils permettent d'appeler le websocket du serveur et de récupérer les données de la partie. 
Entre-temps les données des cookies `user_data` et `user_inventory` sont envoyées afin de vérifier si le joueur est connecté et de récupérer son inventaire.
Si le joueur n'est pas connecté, il est redirigé vers le site principal. S'il l'est, ses données sont stockées dans une liste `sessions`.
Cette liste permet à ce que quand le websocket est appelé, le serveur puisse vérifier si le joueur est connecté et récupérer ses données.
Lorsque le joueur appelle la route `/websocket`, le serveur vérifie donc si le joueur est connecté, puis l'ajoute à la liste des joueurs de la partie qu'il a rejoint.

Dans le front-end, les données de la partie sont récupérées puis transmises à la classe `Game` qui va les utiliser pour afficher le plateau de jeu et les joueurs.

La partie possède un attribut `startedAt`, s'il est `null`, la partie n'a pas commencé. Le front-end affiche alors le lobby.
Le lobby est un plateau de jeu géré par **CannonJS** et un joueur `Truck` qui hérite de `Player`.
Lorsque la partie est commencée, le front-end affiche le plateau de jeu de la partie. Les joueurs sont alors des instances de `Firefighter` qui hérite de `Player`.

Tous les messages du websocket sont interceptés et redistribués par le `script.js` du front-end. C'est lors de cette redistribution puis du traitement par les classes
correspondantes que le jeu multijoueurs est possible.
Même si un seul joueur est connecté, toutes les données sont envoyées au serveur pour éviter les tricheries.


## Quels microservices ?
- **MrPortail sur le port 1000** est utilisé pour récupérer les informations des joueurs, vérifier si les skins de l'inventaire contenus dans le cookie existent
bien dans celui du joueur.
- **NextJS sur le port 443** est utilisé pour envoyer les données de connexion du joueur et de son inventaire au front-end, puis du front-end au back-end. Ceci par le biais de cookies.
- **glb_bank sur le port 4040** est utilisé pour récupérer les modèles 3D des pompiers, de leur sac et des camions.

## À savoir
- Les arbres injouables (tuiles de type "border") sont des **InstancedMesh** afin d'optimiser les performances.
- Les modèles 3D sont entièrement créés par l'auteur principal du repository.

## À modifier
- Les parties en back-end sont stockées dans un tableau. Il faudrait plutôt les stocker en base de données afin de supporter des grandes quantités de parties.
- Le modèle des arbres jouables est chargé à chaque fois qu'une tuile de type "tree" est créée. Il faudrait le charger une seule fois et le cloner.
Après beaucoup de temps perdu dessus, les animations avaient l'air de ne pas fonctionner avec les clones. Il faudrait donc trouver une autre solution.
- Comme ViteJS ne permet que de build un seul `index.html`, il faudrait retirer la page d'accueil des fichiers statics pour en faire une autre page ViteJS.
- Il faudrait vérifier l'emplacement des joueurs dans le backend afin de contrer la triche si les collisions du front-end sont détournées.


## Démarer le projet

Cloner le repository
Toutes les commandes doivent être exécutées à la racine du projet.
Ouvrir Docker
Ouvrir le powershell dans le dossier du projet

Exécuter les commandes suivantes :

```dockerfile
# Run the container in the background
docker run --rm -d -v "${PWD}:/home/bun/app" -p 3010:3010 oven/bun sleep 36000

# Get the container name
$container_name = docker ps -q --filter "ancestor=oven/bun" | ForEach-Object { (docker ps --filter "id=$_" --format "{{.Names}}") }

# Execute a command in the container without specifying its name
docker exec -it $container_name bash

# Install the dependencies
bun i

# Start the game (inside the container)
bun start
```

Le jeu est maintenant accessible sur http://localhost:3010
Si vous n'avez pas de cookie user_data avec les bonnes données, vous serez redirigé vers le site.
Connectez-vous sur le site et copiez le cookie dans le navigateur, collez-le dans le cookie user_data pour localhost:3010 et rafraîchissez la page.


Pour les utilisateurs de linux (pas testé) :

```dockerfile
# Run the container in the background
docker run --rm -d -v "$PWD:/home/bun/app" -p 3010:3010 oven/bun sleep 36000

# Get the container ID
container_id=$(docker ps -q --filter "ancestor=oven/bun")

# Get the container name using the ID
container_name=$(docker ps --filter "id=$container_id" --format "{{.Names}}")

# Execute a command in the container without specifying its name
docker exec -it $container_name bash

# Install the dependencies
bun i

# Start the game (inside the container)
bun start
```
