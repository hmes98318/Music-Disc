import { createServer } from 'node:http';

import express from 'express';
import { Server } from 'socket.io';

import { registerExpressEvents } from '../api/express';
import { registerSocketioEvents } from '../api/socketio';

import type { Client } from 'discord.js';


const loadSite = (client: Client) => {
    return new Promise<void>((resolve, reject) => {
        console.log(`-> loading Web Framework ......`);

        const port = client.config.site.port || 33333;
        const app = express();
        const server = createServer(app);
        const io = new Server(server);


        registerExpressEvents(client, app);
        registerSocketioEvents(client, io);

        server.listen(port, function () {
            console.log(`[api] Server start listening port on ${port}`);
            resolve();
        });
    });
};

export { loadSite };