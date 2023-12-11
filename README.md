# ThreeJS game in docker

How to launch it?

### Start the game

Clone repository

All commands need to be run at the root of the project.

Open Docker

Open the powershell in the project folder

Run the following commands:

```dockerfile
# Run the container in the background
docker run --rm -d -v "${PWD}:/home/bun/app" -p 3010:3010 oven/bun sleep 36000

# Get the container name
$container_name = docker ps -q --filter "ancestor=oven/bun" | ForEach-Object { (docker ps --filter "id=$_" --format "{{.Names}}") }

# Execute a command in the container without specifying its name
docker exec -it $container_name bash

# Start the game (inside the container) after installing the dependencies with "bun i"
bun start
```

The game is now running on http://localhost:3010

For linux users, you can use the following commands:

```dockerfile
# Run the container in the background
docker run --rm -d -v "$PWD:/home/bun/app" -p 3010:3010 oven/bun sleep 36000

# Get the container ID
container_id=$(docker ps -q --filter "ancestor=oven/bun")

# Get the container name using the ID
container_name=$(docker ps --filter "id=$container_id" --format "{{.Names}}")

# Execute a command in the container without specifying its name
docker exec -it $container_name bash

# Start the game (inside the container)
bun start
```

### Build and run the image

```dockerfile
# Use the Dockerfile to build the image.
docker build -t threejs_game .

# Run the image:
docker run -it -d -p 3010:3010 --entrypoint=/bin/bash threejs_game
```
Or build a stack

```dockerfile
# Use the docker-compose.yml to build the stack.
docker-compose up -d
```
