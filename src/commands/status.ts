import { ChatInputCommandInteraction, Client, Message } from "discord.js";
import { embeds } from "../embeds";

import { uptime } from "../utils/functions/uptime";
import { sysusage } from "../utils/functions/sysusage";

export const name = 'status';
export const aliases = ['info'];
export const description = 'Show the bot status';
export const usage = 'status';
export const voiceChannel = false;
export const showHelp = true;
export const options = [];


export const execute = async (client: Client, message: Message) => {
    const systemStatus = {
        load: await sysusage.cpu(),
        memory: sysusage.ram(),
        heap: sysusage.heap(),
        uptime: uptime(client.info.uptime),
        ping: {
            bot: (`${Date.now() - message.createdTimestamp}ms`),
            api: client.ws.ping
        },
        serverCount: client.guilds.cache.size
    }

    return message.reply({
        embeds: [embeds.status(client.config, client.info, systemStatus)],
        allowedMentions: { repliedUser: false }
    });
}

export const slashExecute = async (client: Client, interaction: ChatInputCommandInteraction) => {
    const systemStatus = {
        load: await sysusage.cpu(),
        memory: sysusage.ram(),
        heap: sysusage.heap(),
        uptime: uptime(client.info.uptime),
        ping: {
            bot: (`${Date.now() - interaction.createdTimestamp}ms`),
            api: client.ws.ping
        },
        serverCount: client.guilds.cache.size
    }

    return interaction.reply({
        embeds: [embeds.status(client.config, client.info, systemStatus)],
        allowedMentions: { repliedUser: false }
    });
}