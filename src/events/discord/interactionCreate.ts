import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Client,
    Interaction,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction
} from "discord.js";
import { RepeatMode } from "lavashark";

import { cst } from "../../utils/constants";
import { embeds } from "../../embeds";
import { dashboard } from "../../dashboard";


export default async (client: Client, interaction: Interaction) => {
    if (client.config.blacklist && client.config.blacklist.includes(interaction.user.id)) return;

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

            case 'Dashboard-PlayPause': {
                const playing = !(player.paused);

                if (playing) {
                    player.pause();
                }
                else {
                    player.resume();
                }

                const playPauseButton = new ButtonBuilder().setCustomId('Dashboard-PlayPause').setEmoji(!playing ? cst.button.pause : cst.button.play).setStyle(!playing ? ButtonStyle.Secondary : ButtonStyle.Success);
                const skipButton = new ButtonBuilder().setCustomId('Dashboard-Skip').setEmoji(cst.button.skip).setStyle(ButtonStyle.Secondary);
                const stopButton = new ButtonBuilder().setCustomId('Dashboard-Stop').setEmoji(cst.button.stop).setStyle(ButtonStyle.Danger);
                const loopButton = new ButtonBuilder().setCustomId('Dashboard-Loop').setEmoji(cst.button.loop).setStyle(ButtonStyle.Secondary);
                const shuffleButton = new ButtonBuilder().setCustomId('Dashboard-Shuffle').setEmoji(cst.button.shuffle).setStyle(ButtonStyle.Secondary);
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(playPauseButton, skipButton, stopButton, loopButton, shuffleButton);

                await interaction.update({ components: [row] });
                break;
            }

            case 'Dashboard-Skip': {
                const playing = !(player.paused);
                const repeatMode = player.repeatMode;

                if (repeatMode === RepeatMode.TRACK) {
                    player.setRepeatMode(RepeatMode.OFF);
                    await player.skip();
                    player.setRepeatMode(RepeatMode.TRACK);
                }
                else {
                    await player.skip();
                }

                const playPauseButton = new ButtonBuilder().setCustomId('Dashboard-PlayPause').setEmoji(playing ? cst.button.pause : cst.button.play).setStyle(playing ? ButtonStyle.Secondary : ButtonStyle.Success);
                const skipButton = new ButtonBuilder().setCustomId('Dashboard-Skip').setEmoji(cst.button.skip).setStyle(ButtonStyle.Secondary);
                const stopButton = new ButtonBuilder().setCustomId('Dashboard-Stop').setEmoji(cst.button.stop).setStyle(ButtonStyle.Danger);
                const loopButton = new ButtonBuilder().setCustomId('Dashboard-Loop').setEmoji(cst.button.loop).setStyle(ButtonStyle.Secondary);
                const shuffleButton = new ButtonBuilder().setCustomId('Dashboard-Shuffle').setEmoji(cst.button.shuffle).setStyle(ButtonStyle.Secondary);
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(playPauseButton, skipButton, stopButton, loopButton, shuffleButton);

                await interaction.update({ components: [row] });
                break;
            }

            case 'Dashboard-Loop': {
                let mode = 0;
                const methods = ['Off', 'Single', 'All'];

                const select = new StringSelectMenuBuilder()
                    .setCustomId("Playing-Loop Select")
                    .setPlaceholder("Select the loop mode")
                    .setOptions(methods.map(x => {
                        return {
                            label: x,
                            description: x,
                            value: x
                        }
                    }));

                const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
                let msg = await interaction.reply({ content: `Select a song loop mode.`, ephemeral: true, components: [row] });

                const collector = msg.createMessageComponentCollector({
                    time: 20000, // 20s
                    filter: i => i.user.id === interaction.user.id
                });

                collector.on("collect", async (i: StringSelectMenuInteraction) => {
                    if (i.customId != "Playing-Loop Select") return;
                    console.log('mode:', i.values[0]);
                    switch (i.values[0]) {
                        case 'Off': {
                            mode = 0;
                            player.setRepeatMode(RepeatMode.OFF);
                            break;
                        }
                        case 'Single': {
                            mode = 1;
                            player.setRepeatMode(RepeatMode.TRACK);
                            break;
                        }
                        case 'All': {
                            mode = 2;
                            player.setRepeatMode(RepeatMode.QUEUE);
                            break;
                        }
                    }
                    await dashboard.update(client, player, player.current!);

                    await i.deferUpdate();
                    interaction.ephemeral = true;
                    await interaction.editReply({ content: `✅ | Set loop to \`${methods[mode]}\`.`, components: [] });
                })
                break;
            }

            case 'Dashboard-Stop': {
                if (client.config.autoLeave) {
                    await player.destroy();
                }
                else {
                    player.queue.clear();
                    await player.skip();
                    await dashboard.destroy(player, client.config.embedsColor);
                }

                await interaction.reply({ content: '✅ | Bot leave.', ephemeral: true, components: [] });
                break;
            }

            case 'Dashboard-Shuffle': {
                player.queue.shuffle();

                await interaction.reply({ content: '✅ | Music shuffled.', ephemeral: true, components: [] });
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