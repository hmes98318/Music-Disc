import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    Client,
    Collection,
    Interaction,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction
} from "discord.js";
import { RepeatMode } from "lavashark";

import { cst } from "../../utils/constants";
import { embeds } from "../../embeds";
import { dashboard } from "../../dashboard";

import type { Bot } from "../../@types";


export default async (bot: Bot, client: Client, interaction: Interaction) => {
    if (bot.blacklist && bot.blacklist.includes(interaction.user.id)) return;

    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
    const voiceChannel = guildMember!.voice.channel;

    if (interaction.isButton()) {
        if (!voiceChannel) {
            return interaction.reply({ content: `❌ | You are not connected to an audio channel.`, ephemeral: true, components: [] })
                .catch((error) => {
                    bot.logger.emit('error', '[interactionCreate] Error reply: ' + error);
                });
        }
        if (interaction.guild?.members.me?.voice.channel && voiceChannel.id !== interaction.guild.members.me.voice.channelId) {
            return interaction.reply({ content: `❌ | You are not on the same audio channel as me.`, ephemeral: true, components: [] })
                .catch((error) => {
                    bot.logger.emit('error', '[interactionCreate] Error reply: ' + error);
                });
        }


        const player = client.lavashark.getPlayer(interaction.guild!.id);

        if (!player) {
            return interaction.reply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } })
                .catch((error) => {
                    bot.logger.emit('error', '[interactionCreate] Error reply: ' + error);
                });
        }

        try {
            switch (interaction.customId) {
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
                        .setCustomId("Dashboard-Loop-Select")
                        .setPlaceholder("Select the loop mode")
                        .setOptions(methods.map(x => {
                            return {
                                label: x,
                                description: x,
                                value: x
                            };
                        }));

                    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
                    const msg = await interaction.reply({ content: `Select a song loop mode.`, ephemeral: true, components: [row] });

                    const collector = interaction.channel!.createMessageComponentCollector({
                        time: 20000, // 20s
                        filter: i => i.user.id === interaction.user.id
                    });

                    collector.on("collect", async (i: StringSelectMenuInteraction) => {
                        if (i.customId !== "Dashboard-Loop-Select") return;

                        bot.logger.emit('discord', 'loop mode:' + i.values[0]);
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
                        await dashboard.update(bot, player, player.current!);

                        await i.deferUpdate();
                        interaction.ephemeral = true;
                        await interaction.editReply({ content: `✅ | Set loop to \`${methods[mode]}\`.`, components: [] });
                    });

                    collector.on("end", async (collected: Collection<string, ButtonInteraction>, reason: string) => {
                        if (reason === "time" && collected.size === 0) {
                            await msg.edit({ content: "❌ | Time expired.", components: [], allowedMentions: { repliedUser: false } });
                        }
                    });
                    break;
                }

                case 'Dashboard-Stop': {
                    if (bot.config.autoLeave) {
                        await player.destroy();
                    }
                    else {
                        player.queue.clear();
                        await player.skip();
                        await dashboard.destroy(bot, player, bot.config.embedsColor);
                    }

                    await interaction.reply({ content: '✅ | Bot leave.', ephemeral: true, components: [] });
                    break;
                }

                case 'Dashboard-Shuffle': {
                    player.queue.shuffle();

                    await interaction.reply({ content: '✅ | Music shuffled.', ephemeral: true, components: [] });
                    break;
                }

                case 'musicSave': {
                    const track = player.current;
                    const subtitle = `Author : **${track?.author}**\nDuration **${track?.duration.label}**\n`;

                    guildMember?.send({ embeds: [embeds.save(bot.config.embedsColor, track!.title, subtitle, track!.uri, track!.thumbnail!)] })
                        .then(() => {
                            return interaction.reply({ content: `✅ | I sent you the name of the music in a private message.`, ephemeral: true, components: [] });
                        })
                        .catch((error) => {
                            bot.logger.emit('error', 'Error musicSave:', error);
                            return interaction.reply({ content: `❌ | I can't send you a private message.`, ephemeral: true, components: [] });
                        });

                    break;
                }

                case 'queuelist-prev': {
                    if (!player.queuePage) return;

                    if (player.queuePage.curPage <= 1) {
                        player.queuePage.curPage = 1;
                    }
                    else {
                        player.queuePage.curPage--;
                    }

                    const page = player.queuePage.curPage;
                    const startIdx = (page - 1) * 10;
                    const endIdx = page * 10;

                    const nowplaying = `Now Playing: ${player.current?.title}\n\n`;
                    let tracksQueue = '';
                    const tracks = player.queue.tracks.slice(startIdx, endIdx)
                        .map((track, index) => {
                            return `${startIdx + index + 1}. \`${track.title}\``;
                        });

                    if (tracks.length < 1) {
                        tracksQueue = '------------------------------';
                    }
                    else if (tracks.length === player.queue.tracks.length) {
                        tracksQueue = tracks.join('\n');
                    }
                    else {
                        tracksQueue = tracks.join('\n');
                        tracksQueue += `\n\n----- Page ${page}/${player.queuePage.maxPage} -----`;
                    }

                    const methods = ['Off', 'Single', 'All'];
                    const repeatMode = player.repeatMode;

                    const prevButton = new ButtonBuilder().setCustomId('queuelist-prev').setEmoji(cst.button.prev).setStyle(ButtonStyle.Secondary);
                    const nextButton = new ButtonBuilder().setCustomId('queuelist-next').setEmoji(cst.button.next).setStyle(ButtonStyle.Secondary);
                    const delButton = new ButtonBuilder().setCustomId('queuelist-delete').setLabel(cst.button.delete).setStyle(ButtonStyle.Primary);
                    const clsButton = new ButtonBuilder().setCustomId('queuelist-clear').setLabel(cst.button.clear).setStyle(ButtonStyle.Danger);
                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton, delButton, clsButton);

                    await player.queuePage.msg?.edit({
                        embeds: [embeds.queue(bot.config.embedsColor, nowplaying, tracksQueue, methods[repeatMode])],
                        components: [row],
                        allowedMentions: { repliedUser: false },
                    });

                    await interaction.deferUpdate();
                    break;
                }

                case 'queuelist-next': {
                    if (!player.queuePage) return;

                    if (player.queuePage.curPage >= player.queuePage.maxPage) {
                        player.queuePage.curPage = player.queuePage.maxPage;
                    }
                    else {
                        player.queuePage.curPage++;
                    }

                    const page = player.queuePage.curPage;
                    const startIdx = (page - 1) * 10;
                    const endIdx = page * 10;

                    const nowplaying = `Now Playing: ${player.current?.title}\n\n`;
                    let tracksQueue = '';
                    const tracks = player.queue.tracks.slice(startIdx, endIdx)
                        .map((track, index) => {
                            return `${startIdx + index + 1}. \`${track.title}\``;
                        });

                    if (tracks.length < 1) {
                        tracksQueue = '------------------------------';
                    }
                    else if (tracks.length === player.queue.tracks.length) {
                        tracksQueue = tracks.join('\n');
                    }
                    else {
                        tracksQueue = tracks.join('\n');
                        tracksQueue += `\n\n----- Page ${page}/${player.queuePage.maxPage} -----`;
                    }

                    const methods = ['Off', 'Single', 'All'];
                    const repeatMode = player.repeatMode;

                    const prevButton = new ButtonBuilder().setCustomId('queuelist-prev').setEmoji(cst.button.prev).setStyle(ButtonStyle.Secondary);
                    const nextButton = new ButtonBuilder().setCustomId('queuelist-next').setEmoji(cst.button.next).setStyle(ButtonStyle.Secondary);
                    const delButton = new ButtonBuilder().setCustomId('queuelist-delete').setLabel(cst.button.delete).setStyle(ButtonStyle.Primary);
                    const clsButton = new ButtonBuilder().setCustomId('queuelist-clear').setLabel(cst.button.clear).setStyle(ButtonStyle.Danger);
                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton, delButton, clsButton);

                    await player.queuePage.msg?.edit({
                        embeds: [embeds.queue(bot.config.embedsColor, nowplaying, tracksQueue, methods[repeatMode])],
                        components: [row],
                        allowedMentions: { repliedUser: false },
                    });

                    await interaction.deferUpdate();
                    break;
                }

                case 'queuelist-delete': {
                    await player.queuePage.msg?.delete();
                    player.queuePage.msg = null;

                    await interaction.deferUpdate();
                    break;
                }

                case 'queuelist-clear': {
                    player.queue.clear();

                    if (!player.queuePage) return;

                    player.queuePage.maxPage = Math.ceil(player.queue.tracks.length / 10);
                    player.queuePage.curPage = 1;


                    const page = player.queuePage.curPage;
                    const startIdx = (page - 1) * 10;
                    const endIdx = page * 10;

                    const nowplaying = `Now Playing: ${player.current?.title}\n\n`;
                    let tracksQueue = '';
                    const tracks = player.queue.tracks.slice(startIdx, endIdx)
                        .map((track, index) => {
                            return `${startIdx + index + 1}. \`${track.title}\``;
                        });

                    if (tracks.length < 1) {
                        tracksQueue = '------------------------------';
                    }
                    else if (tracks.length === player.queue.tracks.length) {
                        tracksQueue = tracks.join('\n');
                    }
                    else {
                        tracksQueue = tracks.join('\n');
                        tracksQueue += `\n\n----- Page ${page}/${player.queuePage.maxPage} -----`;
                    }

                    const methods = ['Off', 'Single', 'All'];
                    const repeatMode = player.repeatMode;

                    const delButton = new ButtonBuilder().setCustomId('queuelist-delete').setLabel(cst.button.delete).setStyle(ButtonStyle.Primary);
                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(delButton);

                    await player.queuePage.msg?.edit({
                        embeds: [embeds.queue(bot.config.embedsColor, nowplaying, tracksQueue, methods[repeatMode])],
                        components: [row],
                        allowedMentions: { repliedUser: false },
                    });

                    await interaction.deferUpdate();
                    break;
                }
            }
        }
        catch (error) {
            bot.logger.emit('error', '[interactionCreate] Dashboard error: ' + error);
        }
    }
    else {
        if (!interaction.isCommand() || !interaction.inGuild() || interaction.member.user.bot) return;


        const cmd = client.commands.get(interaction.commandName);

        if (!cmd) return;

        if (cmd.requireAdmin) {
            if (interaction.user.id !== bot.config.admin)
                return interaction.reply({ content: `❌ | This command requires administrator privileges.`, allowedMentions: { repliedUser: false } })
                    .catch((error) => {
                        bot.logger.emit('error', '[interactionCreate] Error reply: ' + error);
                    });
        }

        if (cmd.voiceChannel) {
            if (!voiceChannel) {
                return interaction.reply({ content: `❌ | You are not connected to an audio channel.`, allowedMentions: { repliedUser: false } })
                    .catch((error) => {
                        bot.logger.emit('error', '[interactionCreate] Error reply: ' + error);
                    });
            }
            if (interaction.guild?.members.me?.voice.channel && voiceChannel.id !== interaction.guild.members.me.voice.channelId) {
                return interaction.reply({ content: `❌ | You are not on the same audio channel as me.`, allowedMentions: { repliedUser: false } })
                    .catch((error) => {
                        bot.logger.emit('error', '[interactionCreate] Error reply: ' + error);
                    });
            }
        }


        bot.logger.emit('discord', `[interactionCreate] (${cst.color.grey}${guildMember?.guild.name}${cst.color.white}) ${interaction.user.username} : /${interaction.commandName}`);

        await interaction.deferReply()
            .catch((error) => {
                bot.logger.emit('error', '[interactionCreate] Error deferReply: ' + error);
            });

        cmd.slashExecute(bot, client, interaction);
    }
};