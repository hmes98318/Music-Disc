import {
    ChatInputCommandInteraction,
    Client,
    Collection,
    GatewayIntentBits,
    Message
} from 'discord.js';
import { LavaShark } from 'lavashark';
import consoleStamp from 'console-stamp';

import {
    checkNodesStats,
    loadBlacklist,
    loadCommands,
    loadDiscordEvents,
    loadExpressFramework,
    loadLavaSharkEvents,
    setEnvironment
} from './core/loader';
import { cst } from './utils/constants';
import nodeList from '../node-list.json';

import type { Config, QueuePage, SystemInfo } from './@types';


declare module 'discord.js' {
    export interface Client {
        commands: Collection<unknown, any>,
        lavashark: LavaShark,
        config: Config,
        info: SystemInfo
    }
};

declare module 'lavashark' {
    export interface Player {
        dashboard: Message<boolean> | null,
        metadata: Message<boolean> | ChatInputCommandInteraction | null,
        queuePage: QueuePage
    }
};


consoleStamp(console, { format: ':date(yyyy/mm/dd HH:MM:ss)' });


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
})
client.config = cst.config;




Promise.resolve()
    .then(() => setEnvironment(client))
    .then(() => loadDiscordEvents(client))
    .then(() => loadLavaSharkEvents(client))
    .then(() => loadCommands(client))
    .then(() => checkNodesStats(client))
    .then(() => loadBlacklist(client))
    .then(() => { if (client.config.loadAPI) loadExpressFramework(client) })
    .then(() => {
        console.log(`${cst.color.green}*** All loaded successfully ***${cst.color.white}`);
        client.login(process.env.BOT_TOKEN);
    });




process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});