import { EmbedBuilder, HexColorString } from "discord.js";


const save = (embedsColor: HexColorString | string | number, title: string, subtitle: string, url: string, thumbnail: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setTitle(title)
        .setURL(url)
        .setThumbnail(thumbnail)
        .setDescription(subtitle)
        .setTimestamp();

    return embed_;
};

export { save };