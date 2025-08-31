import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    Client,
    Collection,
    GuildMember,
    Interaction,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction
} from 'discord.js';
import { RepeatMode } from 'lavashark';

import { cst } from '../../utils/constants.js';
import { embeds } from '../../embeds/index.js';
import { dashboard } from '../../dashboard/index.js';
import { PermissionManager } from '../../lib/PermissionManager.js';

import type { Bot } from '../../@types/index.js';


export default async (bot: Bot, client: Client, interaction: Interaction) => {
    if (!interaction.guild || !interaction.guild.members) return;
    if (interaction.user.bot) return;

    if (bot.config.blacklist && bot.config.blacklist.includes(interaction.user.id)) return;


    const guildMember = interaction.guild.members.cache.get(interaction.user.id);
    const voiceChannel = guildMember!.voice.channel;

    if (interaction.isButton()) {
        if (!voiceChannel) {
            return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_NOT_IN_VOICE_CHANNEL'))], ephemeral: true, components: [] })
                .catch((error) => {
                    bot.logger.emit('error', bot.shardId, '[interactionCreate] Error reply: ' + error);
                });
        }
        if (interaction.guild?.members.me?.voice.channel && voiceChannel.id !== interaction.guild.members.me.voice.channelId) {
            return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_NOT_IN_SAME_VOICE_CHANNEL'))], ephemeral: true, components: [] })
                .catch((error) => {
                    bot.logger.emit('error', bot.shardId, '[interactionCreate] Error reply: ' + error);
                });
        }


        const player = client.lavashark.getPlayer(interaction.guild!.id);

        if (!player) {
            return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_NOT_PLAYING'))], allowedMentions: { repliedUser: false } })
                .catch((error) => {
                    bot.logger.emit('error', bot.shardId, '[interactionCreate] Error reply: ' + error);
                });
        }


        try {
            switch (interaction.customId) {
                case 'Dashboard-PlayPause': {
                    // Admin command
                    if (bot.config.command.adminCommand.includes('pause') && bot.config.command.adminCommand.includes('resume')) {
                        if (!bot.config.bot.admin.includes(interaction.user.id))
                            return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_ADMIN'))], ephemeral: true, components: [] })
                                .catch((error) => {
                                    bot.logger.emit('error', bot.shardId, `[messageCreate] Error reply: (${interaction.user.username} : ${interaction.customId})` + error);
                                    return;
                                });
                    }
                    // DJ command
                    if (bot.config.command.djCommand.includes('pause') && bot.config.command.djCommand.includes('resume')) {
                        if (!PermissionManager.hasDJCommandPermission(bot, interaction.user.id, interaction.member as GuildMember, player)) {
                            return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_DJ'))], allowedMentions: { repliedUser: false } })
                                .catch((error) => {
                                    bot.logger.emit('error', bot.shardId, `[interactionCreate] Error reply: (${interaction.user.username} : /${interaction.customId})` + error);
                                });
                        }
                    }


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
                    // Admin command
                    if (bot.config.command.adminCommand.includes('skip')) {
                        if (!bot.config.bot.admin.includes(interaction.user.id))
                            return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_ADMIN'))], ephemeral: true, components: [] })
                                .catch((error) => {
                                    bot.logger.emit('error', bot.shardId, `[messageCreate] Error reply: (${interaction.user.username} : ${interaction.customId})` + error);
                                    return;
                                });
                    }
                    // DJ command
                    if (bot.config.command.djCommand.includes('skip')) {
                        if (!PermissionManager.hasDJCommandPermission(bot, interaction.user.id, interaction.member as GuildMember, player)) {
                            return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_DJ'))], allowedMentions: { repliedUser: false } })
                                .catch((error) => {
                                    bot.logger.emit('error', bot.shardId, `[interactionCreate] Error reply: (${interaction.user.username} : /${interaction.customId})` + error);
                                });
                        }
                    }


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
                    // Admin command
                    if (bot.config.command.adminCommand.includes('loop')) {
                        if (!bot.config.bot.admin.includes(interaction.user.id))
                            return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_ADMIN'))], ephemeral: true, components: [] })
                                .catch((error) => {
                                    bot.logger.emit('error', bot.shardId, `[messageCreate] Error reply: (${interaction.user.username} : ${interaction.customId})` + error);
                                    return;
                                });
                    }
                    // DJ command
                    if (bot.config.command.djCommand.includes('loop')) {
                        if (!PermissionManager.hasDJCommandPermission(bot, interaction.user.id, interaction.member as GuildMember, player)) {
                            return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_DJ'))], allowedMentions: { repliedUser: false } })
                                .catch((error) => {
                                    bot.logger.emit('error', bot.shardId, `[interactionCreate] Error reply: (${interaction.user.username} : /${interaction.customId})` + error);
                                });
                        }
                    }


                    let mode = 0;
                    const methods = ['Off', 'Single', 'All'];

                    const select = new StringSelectMenuBuilder()
                        .setCustomId('Dashboard-Loop-Select')
                        .setPlaceholder('Select the loop mode')
                        .setOptions(methods.map(x => {
                            return {
                                label: x,
                                description: x,
                                value: x
                            };
                        }));

                    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
                    const msg = await interaction.reply({ embeds: [embeds.textMsg(bot, client.i18n.t('events:MESSAGE_SELECT_LOOP_MODE'))], ephemeral: true, components: [row] });

                    const collector = (interaction.channel as any /* discord.js type error ? (v14.16.2) */).createMessageComponentCollector({
                        time: 20000, // 20s
                        filter: (i: any) => i.user.id === interaction.user.id
                    });

                    collector.on('collect', async (i: StringSelectMenuInteraction) => {
                        if (i.customId !== 'Dashboard-Loop-Select') return;

                        bot.logger.emit('discord', bot.shardId, 'loop mode:' + i.values[0]);
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
                        await interaction.editReply({ embeds: [embeds.textSuccessMsg(bot, client.i18n.t('events:MESSAGE_SET_LOOP_MODE', { mode: methods[mode].toUpperCase() }))], components: [] });
                    });

                    collector.on('end', async (collected: Collection<string, ButtonInteraction>, reason: string) => {
                        if (reason === 'time' && collected.size === 0) {
                            await msg.edit({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_TIME_EXPIRED'))], components: [], allowedMentions: { repliedUser: false } });
                        }
                    });
                    break;
                }

                case 'Dashboard-Stop': {
                    // Admin command
                    if (bot.config.command.adminCommand.includes('leave')) {
                        if (!bot.config.bot.admin.includes(interaction.user.id))
                            return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_ADMIN'))], ephemeral: true, components: [] })
                                .catch((error) => {
                                    bot.logger.emit('error', bot.shardId, `[messageCreate] Error reply: (${interaction.user.username} : ${interaction.customId})` + error);
                                    return;
                                });
                    }
                    // DJ command
                    if (bot.config.command.djCommand.includes('leave')) {
                        if (!PermissionManager.hasDJCommandPermission(bot, interaction.user.id, interaction.member as GuildMember, player)) {
                            return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_DJ'))], allowedMentions: { repliedUser: false } })
                                .catch((error) => {
                                    bot.logger.emit('error', bot.shardId, `[interactionCreate] Error reply: (${interaction.user.username} : /${interaction.customId})` + error);
                                });
                        }
                    }


                    if (bot.config.bot.autoLeave.enabled) {
                        player.destroy();
                        await interaction.reply({ embeds: [embeds.textMsg(bot, client.i18n.t('events:MESSAGE_BOT_LEAVE_CHANNEL'))], ephemeral: true, components: [] });
                    }
                    else {
                        player.queue.clear();
                        await player.skip();
                        await dashboard.destroy(bot, player);
                        await interaction.reply({ embeds: [embeds.textMsg(bot, client.i18n.t('events:MESSAGE_BOT_STOP'))], ephemeral: true, components: [] });
                    }

                    break;
                }

                case 'Dashboard-Shuffle': {
                    // Admin command
                    if (bot.config.command.adminCommand.includes('shuffle')) {
                        if (!bot.config.bot.admin.includes(interaction.user.id))
                            return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_ADMIN'))], ephemeral: true, components: [] })
                                .catch((error) => {
                                    bot.logger.emit('error', bot.shardId, `[messageCreate] Error reply: (${interaction.user.username} : ${interaction.customId})` + error);
                                    return;
                                });
                    }
                    // DJ command
                    if (bot.config.command.djCommand.includes('shuffle')) {
                        if (!PermissionManager.hasDJCommandPermission(bot, interaction.user.id, interaction.member as GuildMember, player)) {
                            return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_DJ'))], allowedMentions: { repliedUser: false } })
                                .catch((error) => {
                                    bot.logger.emit('error', bot.shardId, `[interactionCreate] Error reply: (${interaction.user.username} : /${interaction.customId})` + error);
                                });
                        }
                    }


                    player.queue.shuffle();

                    await interaction.reply({ embeds: [embeds.textSuccessMsg(bot, client.i18n.t('events:MESSAGE_MUSIC_SHUFFLE'))], ephemeral: true, components: [] });
                    break;
                }

                case 'musicSave': {
                    const track = player.current;
                    const subtitle = client.i18n.t('events:MESSAGE_NOW_PLAYING_SUBTITLE', { author: track?.author, label: track?.duration.label });

                    guildMember?.send({ embeds: [embeds.save(bot, track!.title, subtitle, track!.uri, track!.thumbnail!)] })
                        .then(() => {
                            return interaction.reply({ embeds: [embeds.textSuccessMsg(bot, client.i18n.t('events:MESSAGE_SEND_PRIVATE_MESSAGE'))], ephemeral: true, components: [] });
                        })
                        .catch((error) => {
                            bot.logger.emit('error', bot.shardId, 'Error musicSave:' + error);
                            return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_SEND_PRIVATE_MESSAGE'))], ephemeral: true, components: [] });
                        });

                    break;
                }

                case 'queuelist-prev': {
                    if (!player.setting.queuePage) return;

                    if (player.setting.queuePage.curPage <= 1) {
                        player.setting.queuePage.curPage = 1;
                    }
                    else {
                        player.setting.queuePage.curPage--;
                    }

                    const page = player.setting.queuePage.curPage;
                    const startIdx = (page - 1) * 10;
                    const endIdx = page * 10;

                    const nowplaying = client.i18n.t('events:MESSAGE_NOW_PLAYING_TITLE', { title: player.current?.title });
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
                        tracksQueue += client.i18n.t('events:MESSAGE_QUEUE_PAGE', { curPage: page, maxPage: player.setting.queuePage.maxPage });
                    }

                    const methods = ['Off', 'Single', 'All'];
                    const repeatMode = player.repeatMode;

                    const prevButton = new ButtonBuilder().setCustomId('queuelist-prev').setEmoji(cst.button.prev).setStyle(ButtonStyle.Secondary);
                    const nextButton = new ButtonBuilder().setCustomId('queuelist-next').setEmoji(cst.button.next).setStyle(ButtonStyle.Secondary);
                    const delButton = new ButtonBuilder().setCustomId('queuelist-delete').setLabel(cst.button.delete).setStyle(ButtonStyle.Primary);
                    const clsButton = new ButtonBuilder().setCustomId('queuelist-clear').setLabel(cst.button.clear).setStyle(ButtonStyle.Danger);
                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton, delButton, clsButton);

                    await player.setting.queuePage.msg?.edit({
                        embeds: [embeds.queue(bot, nowplaying, tracksQueue, methods[repeatMode])],
                        components: [row],
                        allowedMentions: { repliedUser: false },
                    });

                    await interaction.deferUpdate();
                    break;
                }

                case 'queuelist-next': {
                    if (!player.setting.queuePage) return;

                    if (player.setting.queuePage.curPage >= player.setting.queuePage.maxPage) {
                        player.setting.queuePage.curPage = player.setting.queuePage.maxPage;
                    }
                    else {
                        player.setting.queuePage.curPage++;
                    }

                    const page = player.setting.queuePage.curPage;
                    const startIdx = (page - 1) * 10;
                    const endIdx = page * 10;

                    const nowplaying = client.i18n.t('events:MESSAGE_NOW_PLAYING_TITLE', { title: player.current?.title });
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
                        tracksQueue += client.i18n.t('events:MESSAGE_QUEUE_PAGE', { curPage: page, maxPage: player.setting.queuePage.maxPage });
                    }

                    const methods = ['Off', 'Single', 'All'];
                    const repeatMode = player.repeatMode;

                    const prevButton = new ButtonBuilder().setCustomId('queuelist-prev').setEmoji(cst.button.prev).setStyle(ButtonStyle.Secondary);
                    const nextButton = new ButtonBuilder().setCustomId('queuelist-next').setEmoji(cst.button.next).setStyle(ButtonStyle.Secondary);
                    const delButton = new ButtonBuilder().setCustomId('queuelist-delete').setLabel(cst.button.delete).setStyle(ButtonStyle.Primary);
                    const clsButton = new ButtonBuilder().setCustomId('queuelist-clear').setLabel(cst.button.clear).setStyle(ButtonStyle.Danger);
                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton, delButton, clsButton);

                    await player.setting.queuePage.msg?.edit({
                        embeds: [embeds.queue(bot, nowplaying, tracksQueue, methods[repeatMode])],
                        components: [row],
                        allowedMentions: { repliedUser: false },
                    });

                    await interaction.deferUpdate();
                    break;
                }

                case 'queuelist-delete': {
                    if (!player.setting.queuePage) return;

                    await player.setting.queuePage.msg?.delete();
                    player.setting.queuePage.msg = null;

                    await interaction.deferUpdate();
                    break;
                }

                case 'queuelist-clear': {
                    player.queue.clear();

                    if (!player.setting.queuePage) return;

                    player.setting.queuePage.maxPage = Math.ceil(player.queue.tracks.length / 10);
                    player.setting.queuePage.curPage = 1;


                    const page = player.setting.queuePage.curPage;
                    const startIdx = (page - 1) * 10;
                    const endIdx = page * 10;

                    const nowplaying = client.i18n.t('events:MESSAGE_NOW_PLAYING_TITLE', { title: player.current?.title });
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
                        tracksQueue += `\n\n----- Page ${page}/${player.setting.queuePage.maxPage} -----`;
                    }

                    const methods = ['Off', 'Single', 'All'];
                    const repeatMode = player.repeatMode;

                    const delButton = new ButtonBuilder().setCustomId('queuelist-delete').setLabel(cst.button.delete).setStyle(ButtonStyle.Primary);
                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(delButton);

                    await player.setting.queuePage.msg?.edit({
                        embeds: [embeds.queue(bot, nowplaying, tracksQueue, methods[repeatMode])],
                        components: [row],
                        allowedMentions: { repliedUser: false },
                    });

                    await interaction.deferUpdate();
                    break;
                }
            }
        }
        catch (error) {
            bot.logger.emit('error', bot.shardId, '[interactionCreate] Dashboard error: ' + error);
        }
    }
    else {
        if (!interaction.isCommand() || !interaction.inGuild()) return;

        if (!bot.config.bot.slashCommand) {
            return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_SLASH_NOT_ENABLE'))], allowedMentions: { repliedUser: false } })
                .catch((error) => {
                    bot.logger.emit('error', bot.shardId, `[interactionCreate] Error reply: (${interaction.user.username} : /${interaction.commandName})` + error);
                    return;
                });
        }


        const cmd = client.commands.get(interaction.commandName);

        if (!cmd) return;

        if (bot.config.bot.specifyMessageChannel && bot.config.bot.specifyMessageChannel !== interaction.channelId) {
            return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:MESSAGE_SPECIFIC_CHANNEL_WARN', { channelId: bot.config.bot.specifyMessageChannel }))], allowedMentions: { repliedUser: false } })
                .catch((error) => {
                    bot.logger.emit('error', bot.shardId, `[interactionCreate] Error reply: (${interaction.user.username} : /${interaction.commandName})` + error);
                    return;
                });
        }

        // Admin command
        if (bot.config.command.adminCommand.includes(cmd.name)) {
            if (!bot.config.bot.admin.includes(interaction.user.id))
                return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_ADMIN'))], allowedMentions: { repliedUser: false } })
                    .catch((error) => {
                        bot.logger.emit('error', bot.shardId, `[interactionCreate] Error reply: (${interaction.user.username} : /${interaction.commandName})` + error);
                        return;
                    });
        }

        // DJ command
        if (bot.config.command.djCommand.includes(cmd.name)) {
            const player = client.lavashark.getPlayer(interaction.guild!.id);
            if (!PermissionManager.hasDJCommandPermission(bot, interaction.user.id, interaction.member as GuildMember, player || undefined)) {
                return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_DJ'))], allowedMentions: { repliedUser: false } })
                    .catch((error) => {
                        bot.logger.emit('error', bot.shardId, `[interactionCreate] Error reply: (${interaction.user.username} : /${interaction.commandName})` + error);
                    });
            }
        }

        // Check voice channel
        if (cmd.voiceChannel) {
            if (!voiceChannel) {
                return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_NOT_IN_VOICE_CHANNEL'))], allowedMentions: { repliedUser: false } })
                    .catch((error) => {
                        bot.logger.emit('error', bot.shardId, `[interactionCreate] Error reply: (${interaction.user.username} : /${interaction.commandName})` + error);
                        return;
                    });
            }

            if (bot.config.bot.specifyVoiceChannel && voiceChannel.id !== bot.config.bot.specifyVoiceChannel) {
                return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERRPR_NOT_IN_SPECIFIC_VOICE_CHANNEL', { channelId: bot.config.bot.specifyVoiceChannel }))], allowedMentions: { repliedUser: false } })
                    .catch((error) => {
                        bot.logger.emit('error', bot.shardId, `[interactionCreate] Error reply: (${interaction.user.username} : /${interaction.commandName})` + error);
                        return;
                    });
            }

            if (interaction.guild?.members.me?.voice.channel && voiceChannel.id !== interaction.guild.members.me.voice.channelId) {
                return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_NOT_IN_SAME_VOICE_CHANNEL'))], allowedMentions: { repliedUser: false } })
                    .catch((error) => {
                        bot.logger.emit('error', bot.shardId, `[interactionCreate] Error reply: (${interaction.user.username} : /${interaction.commandName})` + error);
                        return;
                    });
            }
        }


        bot.logger.emit('discord', bot.shardId, `[interactionCreate] (${cst.color.grey}${guildMember?.guild.name}${cst.color.white}) ${interaction.user.username} : /${interaction.commandName}`);

        let guild;

        // Ensure guild data is in cache
        try {
            guild = await client.guilds.fetch(interaction.guildId!);
        } catch (error) {
            bot.logger.emit('error', bot.shardId, `[interactionCreate] Error fetching guild: ${error}`);
            return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_GET_GUILD_DATA_CACHE'))], allowedMentions: { repliedUser: false } });
        }

        // Ensure member is in cache
        try {
            await guild.members.fetch(interaction.user.id);
        } catch (error) {
            bot.logger.emit('error', bot.shardId, `[interactionCreate] Error fetching member: ${error}`);
            return interaction.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_GET_GUILD_DATA_CACHE'))], allowedMentions: { repliedUser: false } });
        }


        // Send typing
        try {
            await interaction.deferReply();
        } catch (error) {
            bot.logger.emit('error', bot.shardId, '[interactionCreate] Error deferReply: ' + error);
        }

        cmd.slashExecute(bot, client, interaction);
    }
};