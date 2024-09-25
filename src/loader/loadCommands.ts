import * as fs from 'fs';
import { cst } from './../utils/constants';

import type { Client } from 'discord.js';
import type { Bot } from './../@types';


const loadCommands = (bot: Bot, client: Client) => {
    return new Promise<void>(async (resolve, reject) => {
        bot.logger.emit('log', bot.shardId, `-> loading Commands ......`);

        const files = fs.readdirSync(`${__dirname}/../commands/`);

        bot.logger.emit('log', bot.shardId, `+--------------------------------+`);
        for (const file of files) {
            try {
                const command = await import(`${__dirname}/../commands/${file}`);
                const commandName = command.name.toLowerCase();

                client.commands.set(commandName, command);
                bot.logger.emit('log', bot.shardId, `| Loaded Command ${commandName.padEnd(15, ' ')} |`);
            } catch (error) {
                reject(error);
            }
        }
        bot.logger.emit('log', bot.shardId, `+--------------------------------+`);
        bot.logger.emit('log', bot.shardId, `${cst.color.grey}-- loading Commands finished --${cst.color.white}`);

        resolve();
    });
};

export { loadCommands };