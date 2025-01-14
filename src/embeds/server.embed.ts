import { EmbedBuilder, HexColorString } from 'discord.js';
import { Config } from '../@types/index.js';


const server = (config: Config, serverlist: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(config.bot.embedsColor as HexColorString | number)
        .setTitle(`Servers that have **${config.bot.name}**`)
        .setDescription(serverlist);

    return embed_;
};

export { server };