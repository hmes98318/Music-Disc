import * as fs from 'fs';

import * as dotenv from 'dotenv';
import {
    ChatInputCommandInteraction,
    Client,
    Collection,
    GatewayIntentBits,
    Message
} from 'discord.js';
import { LavaShark } from "lavashark";
import consoleStamp from 'console-stamp';

import { cst } from "./utils/constants";
import nodeList from "../node-list.json";

import type { Config, Info } from "./@types";
import type { Node } from "lavashark";
import type { EventListeners } from 'lavashark/typings/src/@types';


declare module 'discord.js' {
    export interface Client {
        commands: Collection<unknown, any>,
        lavashark: LavaShark,
        config: Config,
        info: Info
    }
};
declare module 'lavashark' {
    export interface Player {
        dashboard: Message<boolean> | null,
        metadata: Message<boolean> | ChatInputCommandInteraction | null
    }
};


dotenv.config();
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




const setEnvironment = () => {
    return new Promise<void>((resolve, _reject) => {
        client.config.name = process.env.BOT_NAME ?? client.config.name;
        client.config.prefix = process.env.PREFIX ?? client.config.prefix;
        client.config.playing = process.env.PLAYING ?? client.config.playing;
        client.config.defaultVolume = Number(process.env.DEFAULT_VOLUME) ?? client.config.defaultVolume;
        client.config.maxVolume = Number(process.env.MAX_VOLUME) ?? client.config.maxVolume;
        client.config.autoLeave = process.env.AUTO_LEAVE === 'true' ?? client.config.autoLeave;
        client.config.autoLeaveCooldown = Number(process.env.AUTO_LEAVE_COOLDOWN) ?? client.config.autoLeaveCooldown;
        client.config.displayVoiceState = process.env.DISPLAY_VOICE_STATE === 'true' ?? client.config.displayVoiceState;
        client.config.port = Number(process.env.PORT) ?? client.config.port;

        // console.log('setEnvironment: ', client.config);
        resolve();
    });
};

const loadEvents = () => {
    console.log(`-> loading Events ......`);
    return new Promise<void>(async (resolve, reject) => {
        const events = fs.readdirSync(`${__dirname}/events/discord/`);

        console.log(`+--------------------------------+`);
        for (const file of events) {
            try {
                const event = await import(`${__dirname}/events/discord/${file}`);
                const eventName = file.split('.')[0];

                client.on(eventName, event.default.bind(null, client));
                console.log(`| Loaded event ${file.split('.')[0].padEnd(17, ' ')} |`);
            }
            catch (error) {
                reject(error);
            }
        }
        console.log(`+--------------------------------+`);
        console.log(`${cst.color.grey}-- loading Events finished --${cst.color.white}`);

        resolve();
    });
}

const loadLavaSharkEvents = () => {
    console.log(`-> loading LavaShark Events ......`);
    return new Promise<void>(async (resolve, reject) => {
        const events = fs.readdirSync(`${__dirname}/events/lavashark/`);

        console.log(`+--------------------------------+`);
        for (const file of events) {
            try {
                const event = await import(`${__dirname}/events/lavashark/${file}`);
                const eventName = file.split('.')[0] as keyof EventListeners<typeof client.lavashark>;

                client.lavashark.on(eventName, event.default.bind(null, client));
                console.log(`| Loaded event ${file.split('.')[0].padEnd(17, ' ')} |`);
            }
            catch (error) {
                reject(error);
            }
        }
        console.log(`+--------------------------------+`);
        console.log(`${cst.color.grey}-- loading LavaShark Events finished --${cst.color.white}`);

        resolve();
    });
}

const loadCommands = () => {
    console.log(`-> loading Commands ......`);
    return new Promise<void>(async (resolve, reject) => {
        const jsFiles = fs.readdirSync(`${__dirname}/commands/`);

        console.log(`+--------------------------------+`);
        for (const file of jsFiles) {
            try {
                const command = await import(`${__dirname}/commands/${file}`);
                client.commands.set(command.name.toLowerCase(), command);
                console.log(`| Loaded Command ${command.name.toLowerCase().padEnd(15, ' ')} |`);
            }
            catch (error) {
                reject(error);
            }
        }
        console.log(`+--------------------------------+`);
        console.log(`${cst.color.grey}-- loading Commands finished --${cst.color.white}`);

        resolve();
    });
}

const checkNodesStats = async (nodes: Node[]) => {
    console.log(`-> Checking stats for all nodes ......`);
    console.log(`+--------------------------------+`);
    for (const node of nodes) {
        try {
            await node.getStats();
            console.log(`| ${node.identifier}: ${cst.color.green}CONNECTED${cst.color.white}`.padEnd(42, ' ') + '|');
        } catch (_) {
            console.log(`| ${node.identifier}: ${cst.color.red}DISCONNECTED${cst.color.white}`.padEnd(42, ' ') + '|');
        }
    }
    console.log(`+--------------------------------+`);
    console.log(`${cst.color.grey}-- All node stats have been checked --${cst.color.white}`);
};

Promise.resolve()
    .then(() => setEnvironment())
    .then(() => loadEvents())
    .then(() => loadLavaSharkEvents())
    .then(() => loadCommands())
    .then(() => checkNodesStats(client.lavashark.nodes))
    .then(() => {
        console.log(`${cst.color.green}*** All loaded successfully ***${cst.color.white}`);
        client.login(process.env.TOKEN);
    });