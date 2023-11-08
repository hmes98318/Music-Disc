import { createServer } from 'node:http';

import express from 'express';
import { Server } from 'socket.io';

import { registerExpressEvents } from '../api/express';
import { registerSocketioEvents } from '../api/socketio';
import { SessionManager } from '../lib/SessionManager';

import type { Client } from 'discord.js';


const loadSite = (client: Client) => {
    return new Promise<void>((resolve, _reject) => {
        console.log(`-> loading Web Framework ......`);

        const port = client.config.site.port || 33333;
        const app = express();
        const server = createServer(app);
        const io = new Server(server);
        const sessionManager = new SessionManager();


        registerExpressEvents(client, app, sessionManager);
        registerSocketioEvents(client, io, sessionManager);


        server.listen(port, function () {
            console.log(`[api] Server start listening port on ${port}`);
            resolve();
        });
    });
};

export { loadSite };