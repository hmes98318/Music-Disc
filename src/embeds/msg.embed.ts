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

export { blacklist };