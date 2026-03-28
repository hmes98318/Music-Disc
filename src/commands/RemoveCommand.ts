import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';
import { embeds } from '../embeds/index.js';

import type { Client, Message, ReadonlyCollection } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class RemoveCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'remove',
            aliases: ['rm'],
            description: i18next.t('commands:CONFIG_REMOVE_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_REMOVE_USAGE'),
            category: CommandCategory.MUSIC,
            voiceChannel: true,
            showHelp: true,
            sendTyping: true,
            options: [
                {
                    name: 'index',
                    description: i18next.t('commands:CONFIG_REMOVE_OPTION_DESCRIPTION'),
                    type: 10,
                    required: false
                },
                {
                    name: 'index2',
                    description: i18next.t('commands:CONFIG_REMOVE_OPTION_DESCRIPTION_2'),
                    type: 10,
                    required: false
                }
            ]
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const player = client.lavashark.getPlayer(context.guild!.id);

        if (!player || !player.playing) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_NO_PLAYING'));
            return;
        }

        const tracks = player.queue.tracks.map((track, index) => `${++index}. \`${track.title}\``);

        if (tracks.length < 1) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:MESSAGE_REMOVE_QUEUE_EMPTY'));
            return;
        }

        // Get index parameters
        const index1 = context.isInteraction()
            ? context.getInteraction().options.getNumber('index')
            : (context.args[0] ? parseInt(context.args[0]) : null);
        const index2 = context.isInteraction()
            ? context.getInteraction().options.getNumber('index2')
            : (context.args[1] ? parseInt(context.args[1]) : null);

        // Case 1: Single index removal (text: +rm 1, slash: /rm index:1)
        if ((index1 !== null && index2 === null) || (index1 === null && index2 !== null)) {
            await this.#removeSingleTrack(bot, client, context, player, tracks, index1 || index2!);
        }
        // Case 2: Range removal (text: +rm 3 4, slash: /rm index:3 index2:4)
        else if (index1 !== null && index2 !== null) {
            await this.#removeRangeTracks(bot, client, context, player, tracks, index1, index2);
        }
        // Case 3: Interactive mode (text: +rm, slash: /rm)
        else {
            await this.#interactiveRemove(bot, client, context, player, tracks);
        }
    }

    /**
     * Remove single track
     * @private
     */
    async #removeSingleTrack(
        bot: Bot,
        client: Client,
        context: CommandContext,
        player: any,
        tracks: string[],
        index: number
    ): Promise<void> {
        const SUCCESS = player.queue.remove(index - 1);

        if (!SUCCESS) {
            if (context.isMessage()) {
                await context.react('❌');
            }
            else {
                await context.replyError(bot, client.i18n.t('commands:MESSAGE_REMOVE_FAIL'));
            }
            return;
        }

        if (context.isMessage()) {
            await context.react('👍');
        }

        await context.reply({
            embeds: [embeds.removeTrack(bot, tracks[index - 1])],
            allowedMentions: { repliedUser: false }
        });
    }

    /**
     * Remove range of tracks
     * @private
     */
    async #removeRangeTracks(
        bot: Bot,
        client: Client,
        context: CommandContext,
        player: any,
        tracks: string[],
        index1: number,
        index2: number
    ): Promise<void> {
        const SUCCESS = player.queue.remove(index1 - 1, index2 - index1 + 1);

        if (!SUCCESS) {
            if (context.isMessage()) {
                await context.react('❌');
            }
            else {
                await context.replyError(bot, client.i18n.t('commands:MESSAGE_REMOVE_FAIL'));
            }
            return;
        }

        const musicTitle = tracks.slice(index1 - 1, index2).join('\n');

        if (context.isMessage()) {
            await context.react('👍');
        }

        await context.reply({
            embeds: [embeds.removeTrack(bot, musicTitle)],
            allowedMentions: { repliedUser: false }
        });
    }

    /**
     * Interactive removal mode
     * @private
     */
    async #interactiveRemove(
        bot: Bot,
        client: Client,
        context: CommandContext,
        player: any,
        tracks: string[]
    ): Promise<void> {
        const nowplaying = client.i18n.t('commands:MESSAGE_NOW_PLAYING_TITLE', {
            title: player.current?.title
        });

        let tracksQueue = '';
        if (tracks.length < 1) {
            tracksQueue = '------------------------------';
        }
        else if (tracks.length > 9) {
            tracksQueue = tracks.slice(0, 10).join('\n');
            tracksQueue += client.i18n.t('commands:MESSAGE_NOW_PLAYING_BUTTOMTITLE', {
                length: tracks.length - 10
            });
        }
        else {
            tracksQueue = tracks.join('\n');
        }

        const methods = [
            client.i18n.t('commands:REPEAT_MODE_OFF'),
            client.i18n.t('commands:REPEAT_MODE_SINGLE'),
            client.i18n.t('commands:REPEAT_MODE_ALL')
        ];
        const repeatMode = player.repeatMode;
        const instruction = client.i18n.t('commands:MESSAGE_REMOVE_INSTRUCTION', {
            length: tracks.length
        });

        if (context.isMessage()) {
            await context.react('👍');
        }

        const msg = await context.reply({
            content: instruction,
            embeds: [embeds.removeList(bot, nowplaying, tracksQueue, methods[repeatMode])],
            allowedMentions: { repliedUser: false }
        });

        // Create message collector
        const collector = (context.channel as any).createMessageCollector({
            time: 10000, // 10s
            filter: (m: any) => m.author.id === context.user.id
        });

        collector.on('collect', async (query: Message<boolean>) => {
            const index = parseInt(query.content);

            if (!index || index <= 0 || index > tracks.length) {
                if (context.isMessage()) {
                    await context.reply({
                        embeds: [embeds.textWarningMsg(bot, client.i18n.t('commands:MESSAGE_REMOVE_CANCEL'))],
                        allowedMentions: { repliedUser: false }
                    });
                }
                else {
                    await context.reply({
                        embeds: [embeds.textWarningMsg(bot, client.i18n.t('commands:MESSAGE_REMOVE_CANCEL'))],
                        allowedMentions: { repliedUser: false }
                    });
                }
                collector.stop();
                return;
            }

            await query.react('👍');
            player.queue.remove(index - 1);

            await query.reply({
                embeds: [embeds.removeTrack(bot, tracks[index - 1])],
                allowedMentions: { repliedUser: false }
            });

            msg.delete().catch(() =>
                bot.logger.emit('discord', bot.shardId, 'Failed to delete message.')
            );

            collector.stop();
        });

        collector.on('end', async (collected: ReadonlyCollection<string, Message<boolean>>, reason: string) => {
            if (reason === 'time' && collected.size === 0) {
                await msg.edit({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_TIME_EXPIRED'))],
                    allowedMentions: { repliedUser: false }
                }).catch(() =>
                    bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.')
                );
            }
        });
    }
}
