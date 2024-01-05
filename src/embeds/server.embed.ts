import { EmbedBuilder, HexColorString } from "discord.js";
import { Config } from "../@types";


const server = (config: Config, serverlist: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(config.embedsColor as HexColorString | number)
        .setTitle(`Servers that have **${config.name}**`)
        .setDescription(serverlist);

    return embed_;
};

export { server };