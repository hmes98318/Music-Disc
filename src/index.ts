import {
    ChatInputCommandInteraction,
    Client,
    Collection,
    GatewayIntentBits,
    Message
} from 'discord.js';
import { LavaShark } from 'lavashark';

import { App } from './core/App';
import nodeList from '../nodelist.json';

import type { QueuePage } from './@types';


declare module 'discord.js' {
    export interface Client {
        commands: Collection<unknown, any>,
        lavashark: LavaShark
    }
};

declare module 'lavashark' {
    export interface Player {
        dashboard: Message<boolean> | null,
        metadata: Message<boolean> | ChatInputCommandInteraction | null,
        queuePage: QueuePage
    }
};




let client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
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
}

main();



process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});