import path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

import { Events } from 'discord.js';
import { cst } from './../utils/constants.js';

import type { Client } from 'discord.js';
import type { Bot } from './../@types/index.js';


const loadDiscordEvents = (bot: Bot, client: Client) => {
    return new Promise<void>(async (resolve, reject) => {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        bot.logger.emit('log', bot.shardId, `-> loading Discord Events ......`);

        const files = fs.readdirSync(`${__dirname}/../events/discord/`);

        bot.logger.emit('log', bot.shardId, `+--------------------------------+`);
        for (const file of files) {
            try {
                const filePath = 'file://' + path.resolve(`${__dirname}/../events/discord/${file}`);
                const eventModule = await import(filePath);
                const event = eventModule.default;
                const eventName = file.split('.')[0];

                if (!bot.config.bot.textCommand && eventName === Events.MessageCreate) {
                    continue;
                }

                client.on(eventName, event.bind(null, bot, client));
                bot.logger.emit('log', bot.shardId, `| Loaded event ${file.split('.')[0].padEnd(17, ' ')} |`);
            } catch (error) {
                reject(error);
            }
        }
        bot.logger.emit('log', bot.shardId, `+--------------------------------+`);
        bot.logger.emit('log', bot.shardId, `${cst.color.grey}-- loading Discord Events finished --${cst.color.white}`);

        resolve();
    });
};

export { loadDiscordEvents };