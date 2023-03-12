const color = { white: '\x1B[0m', grey: '\x1B[2m' };

module.exports = (client, message) => {
    if (message.author.bot || message.channel.type === 'dm')
        return;

    const prefix = client.config.prefix;

    if (message.content.indexOf(prefix) !== 0)
        return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    const cmd = client.commands.get(command) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(command));

    if (cmd && cmd.voiceChannel) {
        if (!message.member.voice.channel)
            return message.channel.send(`⛔ㅣ음성 채널에 연결되어 있지 않습니다.`);

        if (message.guild.members.me.voice.channel && message.member.voice.channelId !== message.guild.members.me.voice.channelId)
            return message.channel.send(`⛔ㅣ당신은 봇과 같은 음성 채널에 있지 않습니다.`);
    }

    if (cmd) {
        console.log(`(${color.grey}${message.guild.name}${color.white}) ${message.author.username} : ${message.content}`);
        cmd.execute(client, message, args);
    }
};
