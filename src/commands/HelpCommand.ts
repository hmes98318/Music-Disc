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

import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class HelpCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'help',
            aliases: ['h'],
            description: i18next.t('commands:CONFIG_HELP_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_HELP_USAGE'),
            category: CommandCategory.UTILITY,
            voiceChannel: false,
            showHelp: true,
            sendTyping: true,
            options: [
                {
                    name: 'command',
                    description: i18next.t('commands:CONFIG_HELP_OPTION_DESCRIPTION'),
                    type: 3,
                    required: false
                }
            ]
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        // Get command parameter
        const commandParam = context.isInteraction()
            ? context.getStringOption('command')
            : context.args.join(' ');

        if (!commandParam) {
            // Show command list with select menus
            await this.#showCommandList(bot, client, context);
        }
        else {
            // Show specific command help
            await this.#showCommandHelp(bot, client, context, commandParam);
        }
    }

    /**
     * Show command list with select menus
     * @private
     */
    async #showCommandList(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const title = client.user?.username;
        const commands = client.commands.getHelpCommands(bot);

        const musicCommands = commands.filter(cmd => {
            const metadata = cmd.getMetadata(bot);
            return metadata.category === CommandCategory.MUSIC;
        });
        const utilityCommands = commands.filter(cmd => {
            const metadata = cmd.getMetadata(bot);
            return metadata.category === CommandCategory.UTILITY;
        });

        // Build select menus
        const musicSelect = new StringSelectMenuBuilder()
            .setCustomId(SelectButtonId.HelpMusic)
            .setPlaceholder('Select a Music command')
            .setOptions(musicCommands.map(cmd => {
                const metadata = cmd.getMetadata(bot);
                return {
                    label: metadata.name,
                    description: `Aliases: ${metadata.aliases && metadata.aliases.length > 0 ? metadata.aliases.join(', ') : 'None'}`,
                    value: metadata.name
                };
            }));

        const utilitySelect = new StringSelectMenuBuilder()
            .setCustomId(SelectButtonId.HelpUtility)
            .setPlaceholder('Select a Utility command')
            .setOptions(utilityCommands.map(cmd => {
                const metadata = cmd.getMetadata(bot);
                return {
                    label: metadata.name,
                    description: `Aliases: ${metadata.aliases && metadata.aliases.length > 0 ? metadata.aliases.join(', ') : 'None'}`,
                    value: metadata.name
                };
            }));

        const musicRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(musicSelect);
        const utilityRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(utilitySelect);

        // Send message
        const msg = await context.reply({
            embeds: [embeds.textMsg(bot, client.i18n.t('commands:MESSAGE_HELP_SELECT_LIST'))],
            components: [musicRow.toJSON(), utilityRow.toJSON()],
            allowedMentions: { repliedUser: false }
        });

        // Create collector
        const collector = msg.createMessageComponentCollector({
            time: 20000, // 20s
            filter: i => i.user.id === context.user.id
        });

        collector.on('collect', async (i: StringSelectMenuInteraction) => {
            if (i.customId !== SelectButtonId.HelpMusic && i.customId !== SelectButtonId.HelpUtility) return;

            const selectedCommand = client.commands.get(i.values[0]);
            if (!selectedCommand) return;

            const metadata = selectedCommand.getMetadata(bot);
            const usage = `${metadata.description}\n\`\`\`${bot.config.bot.prefix}${metadata.usage}\`\`\``;

            await i.deferUpdate();
            await msg.edit({
                embeds: [embeds.help(bot, title!, usage)],
                components: [],
                allowedMentions: { repliedUser: false }
            }).catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));

            collector.stop();
        });

        collector.on('end', async (collected: Collection<string, ButtonInteraction>, reason: string) => {
            if (reason === 'time' && collected.size === 0) {
                await msg.edit({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_TIME_EXPIRED'))],
                    components: [],
                    allowedMentions: { repliedUser: false }
                }).catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));
            }
        });
    }

    /**
     * Show specific command help
     * @private
     */
    async #showCommandHelp(bot: Bot, client: Client, context: CommandContext, commandName: string): Promise<void> {
        const prefix = bot.config.bot.prefix;
        const commands = client.commands.getHelpCommands(bot);

        let found = false;
        for (const cmd of commands) {
            const metadata = cmd.getMetadata(bot);
            if (commandName === metadata.name || (metadata.aliases && metadata.aliases.includes(commandName))) {
                const description = `${metadata.description}\n\`\`\`${prefix}${metadata.usage}\`\`\``;

                await context.reply({
                    embeds: [embeds.help(bot, metadata.name, description)],
                    allowedMentions: { repliedUser: false }
                });

                found = true;
                break;
            }
        }

        if (!found) {
            await context.reply({
                embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_HELP_NOT_FOUND'))],
                allowedMentions: { repliedUser: false }
            });
        }
    }
}
