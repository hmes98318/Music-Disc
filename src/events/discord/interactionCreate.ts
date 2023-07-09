import { Client, Interaction } from "discord.js";
import { cst } from "../../utils/constants";
import { embeds } from "../../embeds";


export default async (client: Client, interaction: Interaction) => {
    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
    const voiceChannel = guildMember!.voice.channel;

    if (interaction.isButton()) {
        if (!voiceChannel) {
            return interaction.reply({ content: `❌ | You are not connected to an audio channel.`, ephemeral: true, components: [] });
        }
        if (interaction.guild?.members.me?.voice.channel && voiceChannel.id !== interaction.guild.members.me.voice.channelId) {
            return interaction.reply({ content: `❌ | You are not on the same audio channel as me.`, ephemeral: true, components: [] });
        }


        const player = client.lavashark.getPlayer(interaction.guild!.id);

        if (!player) {
            return interaction.reply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
        }

        switch (interaction.customId) {
            case 'musicSave': {
                const track = player.current;
                const subtitle = `Author : **${track?.author}**\nDuration **${track?.duration.label}**\n`;

                guildMember?.send({ embeds: [embeds.save(client.config.embedsColor, track!.title, subtitle, track!.uri, track!.thumbnail!)] })
                    .then(() => {
                        return interaction.reply({ content: `✅ | I sent you the name of the music in a private message.`, ephemeral: true, components: [] });
                    })
                    .catch((error) => {
                        console.log('error:', error);
                        return interaction.reply({ content: `❌ | I can't send you a private message.`, ephemeral: true, components: [] });
                    });

                break;
            }
        }
    }


    else {
        if (!interaction.isCommand() || !interaction.inGuild() || interaction.member.user.bot) return;


        const cmd = client.commands.get(interaction.commandName);

        if (cmd && cmd.voiceChannel) {
            if (!voiceChannel) {
                return interaction.reply({ content: `❌ | You are not connected to an audio channel.`, allowedMentions: { repliedUser: false } });
            }
            if (interaction.guild?.members.me?.voice.channel && voiceChannel.id !== interaction.guild.members.me.voice.channelId) {
                return interaction.reply({ content: `❌ | You are not on the same audio channel as me.`, allowedMentions: { repliedUser: false } });
            }
        }

        if (cmd) {
            console.log(`(${cst.color.grey}${guildMember?.guild.name}${cst.color.white}) ${interaction.user.username} : /${interaction.commandName}`);
            await interaction.deferReply();
            cmd.slashExecute(client, interaction);
        }
    }
};