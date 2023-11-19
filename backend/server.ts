// Dependencies
import {file, serve, write} from "bun";

// Import users json file
// @ts-ignore
import users from "./users.json";

const BASE_PATH = "../frontend/dist";

// Create server
const server = Bun.serve({
    port: 9000,
    async fetch(request) {
        const { url, method } = request;
        const { pathname } = new URL(url);

        // For static files
        if (pathname === "/") {
            const indexPath = BASE_PATH + "/index.html";
            const response = new Response(file(indexPath));
            response.headers.set("Cache-Control", "public, max-age=3600");
            return response;
        }

        // Get All Users
        if (pathname === "/api/users" && method === "GET") {
            return new Response(JSON.stringify(users), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-control-allow-origin": "*",
                },
            });
        }
        // Create User
        if (pathname === "/api/users" && method === "POST") {
            const body = await request.json();
            const newJson = users.concat(body);
            // @ts-ignore
            write("./users.json", JSON.stringify(newJson), null, 2);
            return new Response(JSON.stringify(newJson), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-control-allow-origin": "*",
                },
            });
        }
        // Delete User
        // method == 0 is a DELETE request
        // @ts-ignore
        if (pathname === "/api/users" && method == 0) {
            const body = await request.json();
            const newJson = users.filter((user) => user.id !== body.id);
            // @ts-ignore
            write("./users.json", JSON.stringify(newJson), null, 2);
            return new Response(JSON.stringify(newJson), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-control-allow-origin": "*",
                },
            });
        }

        // Update User
        if (pathname === "/api/users" && method === "PUT") {
            const body = await request.json();
            const newJson = users.map((user) => {
                if (user.id === body.id) {
                    return body;
                }
                return user;
            });
            // @ts-ignore
            write("./users.json", JSON.stringify(newJson), null, 2);
            return new Response(JSON.stringify(newJson), {
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
            return new Response("Not Found", { status: 404 });
        }
        return new Response(null, { status: 500 });
    },
});
console.log(`Server running on port ${server.port}`);
