import { EmbedBuilder, HexColorString } from "discord.js";


const help = (embedsColor: HexColorString | string | number, command: string, description: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setTitle(`Command **${command}**`)
        .setDescription(description);

    return embed_;
};

export { help };