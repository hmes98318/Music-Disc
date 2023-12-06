import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { LavaShark } from 'lavashark';

import { App } from './core/App';
import nodeList from '../nodelist.json';




const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});
client.commands = new Collection();
client.lavashark = new LavaShark({
    nodes: nodeList,
    sendWS: (guildId, payload) => { client.guilds.cache.get(guildId)?.shard.send(payload); }
});


const main = async () => {
    const app = new App(client);
    app.initialize();
};
main();


process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});
