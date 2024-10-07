import { EmbedBuilder, HexColorString } from "discord.js";


const blacklist = (embedsColor: HexColorString | string | number, userList: { name: string; value: string; }[]) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setTitle(`There are blacklisted users in the voice channel`)
        .setDescription('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        .addFields(userList)
        .setTimestamp();

    return embed_;
};

const help = (embedsColor: HexColorString | string | number, command: string, description: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setTitle(`Command **${command}**`)
        .setDescription(description);

    return embed_;
};

const filterMsg = (embedsColor: HexColorString | string | number, effectName: string) => {
    const embed_ = new EmbedBuilder()
        .setColor(embedsColor as HexColorString | number)
        .setDescription(`Set filter mode to **${effectName}**`);

    return embed_;
};

export { blacklist, filterMsg, help };