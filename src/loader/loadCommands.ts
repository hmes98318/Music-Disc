import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { cst } from './../utils/constants.js';

import type { Client } from 'discord.js';
import type { Bot } from './../@types/index.js';


const loadCommands = (bot: Bot, client: Client) => {
    return new Promise<void>(async (resolve, reject) => {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        bot.logger.emit('log', bot.shardId, `-> loading Commands ......`);

        const files = fs.readdirSync(`${__dirname}/../commands/`);

        bot.logger.emit('log', bot.shardId, `+--------------------------------+`);
        for (const file of files) {
            try {
                const filePath = 'file://' + path.resolve(`${__dirname}/../commands/${file}`);
                const command = await import(filePath);
                const commandName = command.name.toLowerCase();

                if (bot.config.command.disableCommand.includes(commandName)) {
                    continue;
                }

                client.commands.set(commandName, command);
                bot.logger.emit('log', bot.shardId, `| Loaded Command ${commandName.padEnd(15, ' ')} |`);
            } catch (error) {
                reject(error);
            }
        }
        bot.logger.emit('log', bot.shardId, `+--------------------------------+`);
        bot.logger.emit('log', bot.shardId, `${cst.color.grey}-- loading Commands finished --${cst.color.white}`);

        bot.config.command.adminCommand.forEach((commandName, index) => {
            if (!client.commands.has(commandName)) {
                bot.logger.emit('log', bot.shardId, `Admin command not found: ${commandName}`);
                bot.config.command.adminCommand.splice(index, 1);
            }
        });
        bot.config.command.djCommand.forEach((commandName, index) => {
            if (!client.commands.has(commandName)) {
                bot.logger.emit('log', bot.shardId, `DJ command not found: ${commandName}`);
                bot.config.command.djCommand.splice(index, 1);
            }
        });


        // bot.logger.emit('log', bot.shardId, `Available commands: ${(Array.from(client.commands.keys()) as string[]).join(', ')}`);

        if (bot.config.command.disableCommand.length > 0) {
            bot.logger.emit('log', bot.shardId, `Disabled commands: ${bot.config.command.disableCommand.join(', ')}`);
        }
        else {
            bot.logger.emit('log', bot.shardId, `Disabled commands: NOT SET`);
        }

        if (bot.config.command.adminCommand.length > 0) {
            bot.logger.emit('log', bot.shardId, `Admin commands: ${bot.config.command.adminCommand.join(', ')}`);
        }
        else {
            bot.logger.emit('log', bot.shardId, `Admin commands: NOT SET`);
        }

        if (bot.config.command.djCommand.length > 0) {
            bot.logger.emit('log', bot.shardId, `DJ commands: ${bot.config.command.djCommand.join(', ')}`);
        }
        else {
            bot.logger.emit('log', bot.shardId, `DJ commands: NOT SET`);
        }


        resolve();
    });
};

export { loadCommands };