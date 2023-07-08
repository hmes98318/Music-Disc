import { EmbedBuilder, HexColorString } from "discord.js";


const queue = (embedsColor: HexColorString | string | number, nowPlaying: string, queueList: string, repeatMode: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setTitle('Queue List')
        .addFields({ name: nowPlaying, value: queueList })
        .setTimestamp()
        .setFooter({ text: `Loop: ${repeatMode}` });

    return embed_;
}

export { queue };