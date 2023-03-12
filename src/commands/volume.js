module.exports = {
    name: 'volume',
    aliases: ['v'],
    description: `봇의 음량을 설정합니다.`,
    usage: 'volume <1-200>',
    voiceChannel: true,
    options: [
        {
            name: "volume",
            description: "설정할 음량",
            type: 4,
            required: true,
            min_value: 0
        }
    ],

    async execute(client, message, args) {
        const maxVolume = client.config.maxVolume;
        const queue = client.player.nodes.get(message.guild.id);

        if (!queue || !queue.isPlaying())
            return message.reply({ content: `⛔ㅣ현재 재생 중인 음악이 없습니다.`, allowedMentions: { repliedUser: false } });


        await message.react('👍');
        const vol = parseInt(args[0], 10);

        if (!vol)
            return message.reply({ content: `**현재 음량:** ${queue.node.volume}% \n\n음량을 변경하려면 **\`1\`**에서 **\`${maxVolume}\`** 사이의 숫자를 입력하십시오.`, allowedMentions: { repliedUser: false } });

        if (queue.volume === vol)
            return message.reply({ content: `⛔ㅣ변경하려는 음량이 이미 현재 음량입니다.`, allowedMentions: { repliedUser: false } });

        if (vol < 0 || vol > maxVolume)
            return message.reply({ content: `⛔ㅣ**\`1\`**에서 **\`${maxVolume}\`** 사이의 숫자를 입력하여 음량을 변경합니다.`, allowedMentions: { repliedUser: false } });


        const success = queue.node.setVolume(vol);
        const replymsg = success ? `🔊 **${vol}**/**${maxVolume}**%` : `⛔ㅣSomething went wrong.`;
        return message.reply({ content: replymsg, allowedMentions: { repliedUser: false } });
    },

    async slashExecute(client, interaction) {
        const maxVolume = client.config.maxVolume;
        const queue = client.player.nodes.get(interaction.guild.id);

        if (!queue || !queue.isPlaying())
            return interaction.reply({ content: `⛔ㅣ현재 재생 중인 음악이 없습니다.`, allowedMentions: { repliedUser: false } });

        const vol = parseInt(interaction.options.getInteger("volume"), 10);

        if (!vol)
            return interaction.reply({ content: `**현재 음량:** ${queue.node.volume}% \n\n음량을 변경하려면 **\`1\`**에서 **\`${maxVolume}\`** 사이의 숫자를 입력하십시오.`, allowedMentions: { repliedUser: false } });

        if (queue.volume === vol)
            return interaction.reply({ content: `⛔ㅣ변경하려는 음량이 이미 현재 음량입니다.`, allowedMentions: { repliedUser: false } });

        if (vol < 0 || vol > maxVolume)
            return interaction.reply({ content: `⛔ㅣ**\`1\`**에서 **\`${maxVolume}\`** 사이의 숫자를 입력하여 음량을 변경합니다.`, allowedMentions: { repliedUser: false } });


        const success = queue.node.setVolume(vol);
        const replymsg = success ? `🔊 **${vol}**/**${maxVolume}**%` : `⛔ㅣ문제가 발생했습니다.`;
        return interaction.reply({ content: replymsg, allowedMentions: { repliedUser: false } });
    },
};