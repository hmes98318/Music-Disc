import { EmbedBuilder, HexColorString } from "discord.js";


const removeList = (embedsColor: HexColorString | string | number, nowPlaying: string, queueList: string, repeatMode: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setTitle('Remove List')
        .addFields({ name: nowPlaying, value: queueList })
        .setTimestamp()
        .setFooter({ text: `Loop: ${repeatMode}` });

    return embed_;
};

const removeTrack = (embedsColor: HexColorString | string | number, musicTitle: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setTitle('Removed Music')
        .setDescription(musicTitle)
        .setTimestamp();

    return embed_;
};

export { removeList, removeTrack };