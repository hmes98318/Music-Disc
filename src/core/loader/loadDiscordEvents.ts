import * as fs from 'fs';
import { cst } from '../../utils/constants';

import type { Client } from 'discord.js';


const loadDiscordEvents = (client: Client) => {
    return new Promise<void>(async (resolve, reject) => {
        console.log(`-> loading Events ......`);

        const files = fs.readdirSync(`${__dirname}/../../events/discord/`);

        console.log(`+--------------------------------+`);
        for (const file of files) {
            try {
                const event = await import(`${__dirname}/../../events/discord/${file}`);
                const eventName = file.split('.')[0];

                client.on(eventName, event.default.bind(null, client));
                console.log(`| Loaded event ${file.split('.')[0].padEnd(17, ' ')} |`);
            } catch (error) {
                reject(error);
            }
        }
        console.log(`+--------------------------------+`);
        console.log(`${cst.color.grey}-- loading Events finished --${cst.color.white}`);

        resolve();
    });
};

export { loadDiscordEvents };