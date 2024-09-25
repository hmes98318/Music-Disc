import * as fs from 'fs';
import { cst } from './../utils/constants';

import type { Client } from 'discord.js';
import type { LavaSharkEvents } from 'lavashark/typings/src/@types';
import type { Bot } from './../@types';


const loadLavaSharkEvents = (bot: Bot, client: Client) => {
    return new Promise<void>(async (resolve, reject) => {
        bot.logger.emit('log', bot.shardId, `-> loading LavaShark Events ......`);

        const files = fs.readdirSync(`${__dirname}/../events/lavashark/`);

        bot.logger.emit('log', bot.shardId, `+--------------------------------+`);
        for (const file of files) {
            try {
                const event = await import(`${__dirname}/../events/lavashark/${file}`);
                const eventName = file.split('.')[0] as keyof LavaSharkEvents;

                client.lavashark.on(eventName, event.default.bind(null, bot, client));
                bot.logger.emit('log', bot.shardId, `| Loaded event ${file.split('.')[0].padEnd(17, ' ')} |`);
            } catch (error) {
                reject(error);
            }
        }
        bot.logger.emit('log', bot.shardId, `+--------------------------------+`);
        bot.logger.emit('log', bot.shardId, `${cst.color.grey}-- loading LavaShark Events finished --${cst.color.white}`);

        resolve();
    });
};

export { loadLavaSharkEvents };