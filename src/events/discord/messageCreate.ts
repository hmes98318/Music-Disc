import { Client, Message, ChannelType } from "discord.js";
import { cst } from "../../utils/constants";


export default async (client: Client, message: Message) => {
    const prefix = client.config.prefix;

    if (message.author.bot || message.channel.type !== ChannelType.GuildText) return;
    if (client.config.blacklist && client.config.blacklist.includes(message.author.id)) return;
    if (message.content.indexOf(prefix) !== 0) return;


    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = String(args.shift()).toLowerCase();
    const cmd = client.commands.get(command) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(command));

    if (cmd && cmd.voiceChannel) {
        if (!message.member?.voice.channel)
            return message.reply({ content: `❌ | You are not connected to an audio channel.`, allowedMentions: { repliedUser: false } });

        if (message.guild?.members.me?.voice.channel && message.member.voice.channelId !== message.guild.members.me.voice.channelId)
            return message.reply({ content: `❌ | You are not on the same audio channel as me.`, allowedMentions: { repliedUser: false } });
    }

    if (cmd) {
        console.log(`(${cst.color.grey}${message.guild?.name}${cst.color.white}) ${message.author.username} : ${message.content}`);

        if (cmd.sendTyping) message.channel.sendTyping();
        cmd.execute(client, message, args);
    }
};