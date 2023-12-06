import { EmbedBuilder, HexColorString } from "discord.js";


const ping = (embedsColor: HexColorString | string | number, botPing: string, apiPing: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setTitle('🛰️ LATENCY')
        .setDescription(`Bot : **${botPing}**\nAPI : **${apiPing}ms**`);

    return embed_;
};

export { ping };