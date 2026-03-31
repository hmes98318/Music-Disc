import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ButtonInteraction,
    Collection
} from 'discord.js';
import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';
import { embeds } from '../embeds/index.js';
import { VolumeButtonId } from '../@types/index.js';

import type { Client } from 'discord.js';
import type { Player } from 'lavashark';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class VolumeCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'volume',
            aliases: ['v'],
            description: i18next.t('commands:CONFIG_VOLUME_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_VOLUME_USAGE'),
            category: CommandCategory.MUSIC,
            voiceChannel: true,
            showHelp: true,
            sendTyping: true,
            options: [
                {
                    name: 'volume',
                    description: i18next.t('commands:CONFIG_VOLUME_OPTION_DESCRIPTION'),
                    type: 4,
                    required: false,
                    min_value: 1
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

        const maxVolume = bot.config.bot.volume.max;
        const volumeInput = context.isMessage()
            ? (context.args[0] ? parseInt(context.args[0], 10) : null)
            : context.getIntegerOption('volume');

        // Show volume buttons when no argument is provided
        if (volumeInput === null || (context.isMessage() && !context.args[0])) {
            await this.#showVolumeButtons(bot, client, context, player, maxVolume);
            return;
        }

        // Direct volume setting
        await this.#setVolume(bot, client, context, player, volumeInput, maxVolume);
    }

    /**
     * Show interactive volume selection buttons
     * @private
     */
    async #showVolumeButtons(bot: Bot, client: Client, context: CommandContext, player: any, maxVolume: number): Promise<void> {
        const currentVolume = player.volume;

        const volume25Button = new ButtonBuilder()
            .setCustomId(VolumeButtonId.Volume25)
            .setLabel('25%')
            .setStyle(currentVolume === 25 ? ButtonStyle.Success : ButtonStyle.Secondary);

        const volume50Button = new ButtonBuilder()
            .setCustomId(VolumeButtonId.Volume50)
            .setLabel('50%')
            .setStyle(currentVolume === 50 ? ButtonStyle.Success : ButtonStyle.Secondary);

        const volume75Button = new ButtonBuilder()
            .setCustomId(VolumeButtonId.Volume75)
            .setLabel('75%')
            .setStyle(currentVolume === 75 ? ButtonStyle.Success : ButtonStyle.Secondary);

        const volume100Button = new ButtonBuilder()
            .setCustomId(VolumeButtonId.Volume100)
            .setLabel('100%')
            .setStyle(currentVolume === 100 ? ButtonStyle.Success : ButtonStyle.Secondary);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(volume25Button, volume50Button, volume75Button, volume100Button);

        const msg = await context.reply({
            embeds: [embeds.textMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_SELECT', { volume: currentVolume }))],
            components: [row]
        });

        const collector = msg.createMessageComponentCollector({
            time: 20000, // 20s
            filter: i => i.user.id === context.user.id
        });

        collector.on('collect', async (i: ButtonInteraction) => {
            // Map customId to volume value
            const volumeMap: Record<string, number> = {
                [VolumeButtonId.Volume25]: 25,
                [VolumeButtonId.Volume50]: 50,
                [VolumeButtonId.Volume75]: 75,
                [VolumeButtonId.Volume100]: 100,
            };

            const newVolume = volumeMap[i.customId];
            if (!newVolume) return;

            if (player.volume === newVolume) {
                await i.update({
                    embeds: [embeds.textWarningMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_SAME'))],
                    components: []
                });
                return collector.stop();
            }

            if (newVolume > maxVolume) {
                await i.update({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_ARGS_ERROR_2', { maxVolume }))],
                    components: []
                });
                return collector.stop();
            }

            player.setting.volume = newVolume;
            player.filters.setVolume(newVolume);

            await client.dashboard.update(player, player.current!);

            await i.update({
                embeds: [embeds.textSuccessMsg(bot, client.i18n.t('commands:MESSAGE_VOLUME_SUCCESS', { volume: newVolume, maxVolume }))],
                components: []
            });

            return collector.stop();
        });

        collector.on('end', async (collected: Collection<string, ButtonInteraction>, reason: string) => {
            if (reason === 'time' && collected.size === 0) {
                await msg.edit({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_TIME_EXPIRED'))],
                    components: []
                })
                    .catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));
            }
        });
    }

    /**
     * Set volume directly
     * @private
     */
    async #setVolume(bot: Bot, client: Client, context: CommandContext, player: Player, vol: number, maxVolume: number): Promise<void> {
        if (context.isMessage()) {
            await context.react('👍');
        }

        if (!vol) {
            await context.replyError(bot, client.i18n.t('commands:MESSAGE_VOLUME_ARGS_ERROR', { volume: player.volume, maxVolume }));
            return;
        }

        if (player.volume === vol) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:MESSAGE_VOLUME_SAME'));
            return;
        }

        if (vol < 0 || vol > maxVolume) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:MESSAGE_VOLUME_ARGS_ERROR_2', { maxVolume }));
            return;
        }

        player.setting.volume = vol;
        player.filters.setVolume(vol);

        await client.dashboard.update(player, player.current!);

        await context.replySuccess(bot, client.i18n.t('commands:MESSAGE_VOLUME_SUCCESS', { volume: vol, maxVolume }));
    }
}
