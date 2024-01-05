import { EmbedBuilder, HexColorString } from "discord.js";


const addTrack = (embedsColor: HexColorString | string | number, title: string, subtitle: string, url: string, thumbnail: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setTitle(title)
        .setURL(url)
        .setThumbnail(thumbnail)
        .addFields({ name: 'Added Track', value: subtitle, inline: true })
        .setTimestamp();

    return embed_;
};

const addPlaylist = (embedsColor: HexColorString | string | number, title: string, subtitle: string, url: string, thumbnail: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setTitle(title)
        .setURL(url)
        .setThumbnail(thumbnail)
        .addFields({ name: 'Added Playlist', value: subtitle, inline: true })
        .setTimestamp();

    return embed_;
};

const queue = (embedsColor: HexColorString | string | number, nowPlaying: string, queueList: string, repeatMode: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setTitle('Queue List')
        .addFields({ name: nowPlaying, value: queueList })
        .setTimestamp()
        .setFooter({ text: `Loop: ${repeatMode}` });

    return embed_;
};

export { addTrack, addPlaylist, queue };