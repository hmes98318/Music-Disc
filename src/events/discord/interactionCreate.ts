import { Client, GuildMember, Interaction } from 'discord.js';

import { cst } from '../../utils/constants.js';
import { embeds } from '../../embeds/index.js';
import { PermissionManager } from '../../lib/PermissionManager.js';
import { PlayPauseButtonHandler } from '../../lib/handlers/PlayPauseButtonHandler.js';
import { SkipButtonHandler } from '../../lib/handlers/SkipButtonHandler.js';
import { LoopButtonHandler } from '../../lib/handlers/LoopButtonHandler.js';
import { StopButtonHandler } from '../../lib/handlers/StopButtonHandler.js';
import { ShuffleButtonHandler } from '../../lib/handlers/ShuffleButtonHandler.js';
import { MusicSaveButtonHandler } from '../../lib/handlers/MusicSaveButtonHandler.js';
import { QueueButtonHandler } from '../../lib/handlers/QueueButtonHandler.js';
import { DashboardButtonId, QueueButtonId, MusicButtonId } from '../../@types/index.js';

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
                case DashboardButtonId.PlayPause: {
                    await PlayPauseButtonHandler.handle(bot, client, interaction, player);
                    break;
                }

                case DashboardButtonId.Skip: {
                    await SkipButtonHandler.handle(bot, client, interaction, player);
                    break;
                }

                case DashboardButtonId.Loop: {
                    await LoopButtonHandler.handle(bot, client, interaction, player);
                    break;
                }

                case DashboardButtonId.Stop: {
                    await StopButtonHandler.handle(bot, client, interaction, player);
                    break;
                }

                case DashboardButtonId.Shuffle: {
                    await ShuffleButtonHandler.handle(bot, client, interaction, player);
                    break;
                }

                case MusicButtonId.Save: {
                    await MusicSaveButtonHandler.handle(bot, client, interaction, player);
                    break;
                }

                case QueueButtonId.Previous: {
                    await QueueButtonHandler.handlePreviousPage(bot, client, interaction, player);
                    break;
                }

                case QueueButtonId.Next: {
                    await QueueButtonHandler.handleNextPage(bot, client, interaction, player);
                    break;
                }

                case QueueButtonId.Delete: {
                    await QueueButtonHandler.handleDelete(bot, client, interaction, player);
                    break;
                }

                case QueueButtonId.Clear: {
                    await QueueButtonHandler.handleClear(bot, client, interaction, player);
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
