# ThreeJS game in docker

How to launch it?

All commands need to be run at the root of the project.
### Clone repository


### Set the file directory and open command prompt
Open Docker

Run this command:

```dockerfile
docker run --rm -d -v C:/Users/your_cloned_repo_directory:/home/bun/app -p 9000:9000 oven/bun sleep 36000
```

Get the container name, then run this command:

```dockerfile
docker exec -it container_name bash
```

### Build and run image

```dockerfile
docker build -t threejs_game .
```

Use the Dockerfile to build the image.

Run the image:

```dockerfile
docker run -it -d -p 9000:9000 --entrypoint=/bin/bash threejs_game
```

### Or build a stack

```dockerfile
docker-compose up -d
```

Use the docker-compose.yml to build the stack.
