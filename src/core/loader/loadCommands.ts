import * as fs from 'fs';
import { cst } from '../../utils/constants';

import type { Client } from 'discord.js';


const loadCommands = (client: Client) => {
    return new Promise<void>(async (resolve, reject) => {
        console.log(`-> loading Commands ......`);

        const files = fs.readdirSync(`${__dirname}/../../commands/`);

        console.log(`+--------------------------------+`);
        for (const file of files) {
            try {
                const command = await import(`${__dirname}/../../commands/${file}`);
                const commandName = command.name.toLowerCase();

                client.commands.set(commandName, command);
                console.log(`| Loaded Command ${commandName.padEnd(15, ' ')} |`);
            } catch (error) {
                reject(error);
            }
        }
        console.log(`+--------------------------------+`);
        console.log(`${cst.color.grey}-- loading Commands finished --${cst.color.white}`);

        resolve();
    });
};

export { loadCommands };