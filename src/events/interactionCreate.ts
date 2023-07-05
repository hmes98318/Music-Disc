import { Client, ChatInputCommandInteraction } from "discord.js";
import { cst } from "../utils/constants";


export default async (client: Client, interaction: ChatInputCommandInteraction) => {

    if (interaction.isButton()) { }
    else {
        if (!interaction.isCommand() || !interaction.inGuild() || interaction.member.user.bot) return;


        const cmd = client.commands.get(interaction.commandName);
        const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
        const voiceChannel = guildMember!.voice.channel;

        if (cmd && cmd.voiceChannel) {
            if (!voiceChannel)
                return interaction.reply({ content: `❌ | You are not connected to an audio channel.`, allowedMentions: { repliedUser: false } });

            if (interaction.guild?.members.me?.voice.channel && voiceChannel.id !== interaction.guild.members.me.voice.channelId)
                return interaction.reply({ content: `❌ | You are not on the same audio channel as me.`, allowedMentions: { repliedUser: false } });
        }

        if (cmd) {
            console.log(`(${cst.color.grey}${guildMember?.guild.name}${cst.color.white}) ${interaction.user.username} : /${interaction.commandName}`);
            await interaction.deferReply();
            cmd.slashExecute(client, interaction);
        }
    }
};