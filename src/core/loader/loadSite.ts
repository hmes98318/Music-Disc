import { createServer } from 'node:http';

import express from 'express';
import { Server } from 'socket.io';

import { registerExpressEvents } from '../api/express';
import { registerSocketioEvents } from '../api/socketio';
import { SessionManager } from '../lib/SessionManager';

import type { Client } from 'discord.js';
import type { Bot } from '../../@types';
import type { LocalNodeController } from '../lib/LocalNodeController';


const loadSite = (bot: Bot, client: Client, localNodeController: LocalNodeController) => {
    return new Promise<void>((resolve, _reject) => {
        bot.logger.emit('api', `-> loading Web Framework ......`);

        const port = bot.config.site.port || 33333;
        const app = express();
        const server = createServer(app);
        const io = new Server(server);
        const sessionManager = new SessionManager();


        registerExpressEvents(bot, client, localNodeController, app, sessionManager);
        registerSocketioEvents(bot, client, localNodeController, io, sessionManager);


        server.listen(port, function () {
            bot.logger.emit('api', `Server start listening port on ${port}`);
            resolve();
        });
    });
};

export { loadSite };