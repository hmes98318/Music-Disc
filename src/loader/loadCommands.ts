import { cst } from './../utils/constants.js';
import { CommandRegistry } from '../commands/base/CommandRegistry.js';
import { registerAllCommands } from '../commands/index.js';

import type { Client } from 'discord.js';
import type { Bot } from './../@types/index.js';


const loadCommands = (bot: Bot, client: Client) => {
    return new Promise<void>(async (resolve, reject) => {
        try {
            bot.logger.emit('log', bot.shardId, `-> loading Commands ......`);

            // Create command registry
            const registry = new CommandRegistry();

            // Register all commands
            registerAllCommands(registry, bot);

            // Assign registry to client
            client.commands = registry;

            // Log registered commands
            const commandNames = registry.getAllNames();
            bot.logger.emit('log', bot.shardId, `+--------------------------------+`);
            for (const commandName of commandNames) {
                bot.logger.emit('log', bot.shardId, `| Loaded Command ${commandName.padEnd(15, ' ')} |`);
            }
            bot.logger.emit('log', bot.shardId, `+--------------------------------+`);
            bot.logger.emit('log', bot.shardId, `${cst.color.grey}-- loading Commands finished --${cst.color.white}`);

            // Validate admin commands
            bot.config.command.adminCommand = bot.config.command.adminCommand.filter((commandName) => {
                const exists = registry.has(commandName);
                if (!exists) {
                    bot.logger.emit('log', bot.shardId, `Admin command not found: ${commandName}`);
                }
                return exists;
            });

            // Validate DJ commands
            bot.config.command.djCommand = bot.config.command.djCommand.filter((commandName) => {
                const exists = registry.has(commandName);
                if (!exists) {
                    bot.logger.emit('log', bot.shardId, `DJ command not found: ${commandName}`);
                }
                return exists;
            });

            // Log configuration
            if (bot.config.command.disableCommand.length > 0) {
                bot.logger.emit('log', bot.shardId, `Disabled commands: ${bot.config.command.disableCommand.join(', ')}`);
            } else {
                bot.logger.emit('log', bot.shardId, `Disabled commands: NOT SET`);
            }

            if (bot.config.command.adminCommand.length > 0) {
                bot.logger.emit('log', bot.shardId, `Admin commands: ${bot.config.command.adminCommand.join(', ')}`);
            } else {
                bot.logger.emit('log', bot.shardId, `Admin commands: NOT SET`);
            }

            if (bot.config.command.djCommand.length > 0) {
                bot.logger.emit('log', bot.shardId, `DJ commands: ${bot.config.command.djCommand.join(', ')}`);
            } else {
                bot.logger.emit('log', bot.shardId, `DJ commands: NOT SET`);
            }

            resolve();
        } catch (error) {
            reject(error);
        }
    });
};

export { loadCommands };