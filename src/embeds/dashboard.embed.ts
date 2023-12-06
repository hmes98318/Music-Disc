import { EmbedBuilder, HexColorString } from "discord.js";


const connected = (embedsColor: HexColorString | string | number) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setDescription('Voice channel connected successfully.');

    return embed_;
};

const disconnect = (embedsColor: HexColorString | string | number) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setDescription('Finished playing.');

    return embed_;
};

const dashboard = (embedsColor: HexColorString | string | number, status: string, title: string, subtitle: string, url: string, thumbnail: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setTitle(title)
        .setURL(url)
        .setThumbnail(thumbnail)
        .addFields({ name: status, value: subtitle })
        .setTimestamp();

    return embed_;
};
export { connected, disconnect, dashboard };