import express from 'express';

import { registerExpressEvents } from '../lib/api/express.js';
import { SessionManager } from '../lib/session-manager/SessionManager.js';

import type { ShardingManager } from 'discord.js';
import type { Bot } from './../@types/index.js';
import type { LocalNodeController } from '../lib/localnode/LocalNodeController.js';


const loadSite = (bot: Bot, shardManager: ShardingManager, localNodeController: LocalNodeController) => {
    return new Promise<void>((resolve, _reject) => {
        bot.logger.emit('api', `-> loading Web Framework ......`);

        const port = bot.config.webDashboard.port || 33333;
        const app = express();
        const sessionManager = new SessionManager(bot.config.webDashboard.sessionManager, bot.config.webDashboard.ipBlocker);


        registerExpressEvents(bot, shardManager, localNodeController, app, sessionManager);

        app.listen(port, () => {
            bot.logger.emit('api', `Server start listening port on ${port}`);
            resolve();
        });
    });
};

export { loadSite };