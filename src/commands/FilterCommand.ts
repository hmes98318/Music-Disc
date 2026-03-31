import {
    ActionRowBuilder,
    ButtonInteraction,
    Collection,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction
} from 'discord.js';
import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory, SelectButtonId } from '../@types/index.js';
import { embeds } from '../embeds/index.js';
import { filtersConfig } from '../utils/constants.js';

import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class FilterCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'filter',
            aliases: ['eq', 'equalizer'],
            description: i18next.t('commands:CONFIG_FILTER_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_FILTER_USAGE'),
            category: CommandCategory.MUSIC,
            voiceChannel: true,
            showHelp: true,
            sendTyping: true,
            options: [
                {
                    name: 'filter',
                    description: i18next.t('commands:CONFIG_FILTER_OPTION_DESCRIPTION'),
                    type: 3,
                    required: true,
                    choices: [
                        ...(Object.keys(filtersConfig).map((effectName) => ({
                            name: effectName,
                            value: effectName
                        }))),
                        { name: 'clear', value: 'clear' }
                    ]
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

        // Get filter parameter
        const filterParam = context.isInteraction()
            ? context.getStringOption('filter')
            : context.args.join(' ');

        if (!filterParam) {
            // Show interactive filter selection (only for text commands)
            await this.#showFilterSelection(bot, client, context, player);
        }
        else {
            // Apply filter directly
            await this.#applyFilter(bot, client, context, player, filterParam.toLowerCase());
        }
    }

    /**
     * Show interactive filter selection menu
     * @private
     */
    async #showFilterSelection(
        bot: Bot,
        client: Client,
        context: CommandContext,
        player: any
    ): Promise<void> {
        const select = new StringSelectMenuBuilder()
            .setCustomId(SelectButtonId.Filter)
            .setPlaceholder(client.i18n.t('commands:MESSAGE_FILTER_SELECT_MODE'))
            .setOptions([
                ...(Object.keys(filtersConfig).map((effectName) => ({
                    label: effectName,
                    value: effectName
                }))),
                { label: 'clear', value: 'clear' }
            ]);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
        const msg = await context.reply({
            embeds: [embeds.textMsg(bot, client.i18n.t('commands:MESSAGE_FILTER_SELECT_LIST'))],
            components: [row.toJSON()],
            allowedMentions: { repliedUser: false }
        });

        const collector = msg.createMessageComponentCollector({
            time: 20000, // 20s
            filter: i => i.user.id === context.user.id
        });

        collector.on('collect', async (i: StringSelectMenuInteraction) => {
            if (i.customId !== SelectButtonId.Filter) return;

            const effectName = i.values[0];

            if (effectName === 'clear') {
                player.filters.clear();
            }
            else {
                if (!Object.keys(filtersConfig).includes(effectName)) {
                    await context.reply({
                        embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_FILTER_NOT_FOUND'))],
                        allowedMentions: { repliedUser: false }
                    });
                    collector.stop();
                    return;
                }

                player.filters.set(filtersConfig[(effectName as keyof typeof filtersConfig)]);
            }

            if (context.isMessage()) {
                await context.react('👍');
            }

            await i.deferUpdate();
            await msg.edit({
                embeds: [embeds.filterMsg(bot, effectName)],
                components: [],
                allowedMentions: { repliedUser: false }
            }).catch(() =>
                bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.')
            );

            collector.stop();
        });

        collector.on('end', async (collected: Collection<string, ButtonInteraction>, reason: string) => {
            if (reason === 'time' && collected.size === 0) {
                await msg.edit({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_TIME_EXPIRED'))],
                    components: [],
                    allowedMentions: { repliedUser: false }
                }).catch(() =>
                    bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.')
                );
            }
        });
    }

    /**
     * Apply filter directly
     * @private
     */
    async #applyFilter(
        bot: Bot,
        client: Client,
        context: CommandContext,
        player: any,
        effectName: string
    ): Promise<void> {
        if (effectName === 'clear') {
            player.filters.clear();
        }
        else {
            if (!Object.keys(filtersConfig).includes(effectName)) {
                await context.replyEphemeralError(bot, client.i18n.t('commands:MESSAGE_FILTER_NOT_FOUND'));
                return;
            }

            player.filters.set(filtersConfig[(effectName as keyof typeof filtersConfig)]);
        }

        if (context.isMessage()) {
            await context.react('👍');
        }

        await context.reply({
            embeds: [embeds.filterMsg(bot, effectName)],
            components: [],
            allowedMentions: { repliedUser: false }
        }).catch(() =>
            bot.logger.emit('discord', bot.shardId, 'Failed to edit message.')
        );
    }
}
