import {
    ActionRowBuilder,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Client,
    Collection,
    Message,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction
} from 'discord.js';
import i18next from 'i18next';

import { embeds } from '../embeds/index.js';
import { CommandCategory } from '../@types/index.js';

import type { Bot } from '../@types/index.js';


export const name = 'help';
export const aliases = ['h'];
export const description = i18next.t('commands:CONFIG_HELP_DESCRIPTION');
export const usage = i18next.t('commands:CONFIG_HELP_USAGE');
export const category = CommandCategory.UTILITY;
export const voiceChannel = false;
export const showHelp = true;
export const sendTyping = true;
export const options = [
    {
        name: 'command',
        description: i18next.t('commands:CONFIG_HELP_OPTION_DESCRIPTION'),
        type: 3,
        required: false
    }
];


export const execute = async (bot: Bot, client: Client, message: Message, args: string[]) => {
    const prefix = bot.config.bot.prefix;

    if (!args[0]) {
        const title = client.user?.username;
        const commands = client.commands.filter(x => x.showHelp !== false);

        const musicCommands = commands.filter(x => x.category === CommandCategory.MUSIC);
        const utilityCommands = commands.filter(x => x.category === CommandCategory.UTILITY);

        const musicSelect = new StringSelectMenuBuilder()
            .setCustomId('musicHelpSelect')
            .setPlaceholder('Select a Music command')
            .setOptions(musicCommands.map(x => ({
                label: x.name,
                description: `Aliases: ${x.aliases[0] ? x.aliases.join(', ') : 'None'}`,
                value: x.name
            })));

        const utilitySelect = new StringSelectMenuBuilder()
            .setCustomId('utilityHelpSelect')
            .setPlaceholder('Select a Utility command')
            .setOptions(utilityCommands.map(x => ({
                label: x.name,
                description: `Aliases: ${x.aliases[0] ? x.aliases.join(', ') : 'None'}`,
                value: x.name
            })));

        const musicRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(musicSelect);
        const utilityRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(utilitySelect);

        const msg = await message.reply({
            embeds: [embeds.textMsg(bot, client.i18n.t('commands:MESSAGE_HELP_SELECT_LIST'))],
            components: [musicRow.toJSON(), utilityRow.toJSON()],
            allowedMentions: { repliedUser: false }
        });

        const collector = msg.createMessageComponentCollector({
            time: 20000, // 20s
            filter: i => i.user.id === message.author.id
        });

        collector.on('collect', async (i: StringSelectMenuInteraction) => {
            if (i.customId !== 'musicHelpSelect' && i.customId !== 'utilityHelpSelect') return;

            const cmd = commands.find(x => x.name === i.values[0]);
            const usage = `${cmd.description}\n\`\`\`${prefix}${cmd.usage}\`\`\``;

            i.deferUpdate();
            await msg.edit({
                embeds: [embeds.help(bot, title!, usage)],
                components: [],
                allowedMentions: { repliedUser: false }
            })
                .catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));

            return collector.stop();
        });

        collector.on('end', async (collected: Collection<string, ButtonInteraction>, reason: string) => {
            if (reason == 'time' && collected.size == 0) {
                await msg.edit({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_TIME_EXPIRED'))],
                    components: [],
                    allowedMentions: { repliedUser: false }
                })
                    .catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));
            }
        });
    }
    else {
        const helpCmd = args[0];
        const commands = client.commands.filter(x => x.showHelp !== false);

        let found = false;
        found = commands.find(x => {
            if (helpCmd === x.name || x.aliases.includes(helpCmd)) {
                const command = x.name;
                const description = `${x.description}\n\`\`\`${prefix}${x.usage}\`\`\``;

                message.reply({
                    embeds: [embeds.help(bot, command, description)],
                    allowedMentions: { repliedUser: false }
                });
                return true;
            }
        });

        if (!found) return message.reply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_HELP_NOT_FOUND'))], allowedMentions: { repliedUser: false } });
    }
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const prefix = bot.config.bot.prefix;
    const command = interaction.options.getString('command');

    if (!command) {
        const title = client.user?.username;
        const commands = client.commands.filter(x => x.showHelp !== false);

        const musicCommands = commands.filter(x => x.category === CommandCategory.MUSIC);
        const utilityCommands = commands.filter(x => x.category === CommandCategory.UTILITY);

        const musicSelect = new StringSelectMenuBuilder()
            .setCustomId('musicHelpSelect')
            .setPlaceholder('Select a Music command')
            .setOptions(musicCommands.map(x => ({
                label: x.name,
                description: `Aliases: ${x.aliases[0] ? x.aliases.join(', ') : 'None'}`,
                value: x.name
            })));

        const utilitySelect = new StringSelectMenuBuilder()
            .setCustomId('utilityHelpSelect')
            .setPlaceholder('Select a Utility command')
            .setOptions(utilityCommands.map(x => ({
                label: x.name,
                description: `Aliases: ${x.aliases[0] ? x.aliases.join(', ') : 'None'}`,
                value: x.name
            })));

        const musicRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(musicSelect);
        const utilityRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(utilitySelect);

        const msg = await interaction.editReply({
            embeds: [embeds.textMsg(bot, client.i18n.t('commands:MESSAGE_HELP_SELECT_LIST'))],
            components: [musicRow.toJSON(), utilityRow.toJSON()],
            allowedMentions: { repliedUser: false }
        });

        const collector = msg.createMessageComponentCollector({
            time: 20000, // 20s
            filter: i => i.user.id === interaction.user.id
        });

        collector.on('collect', async (i: StringSelectMenuInteraction) => {
            if (i.customId !== 'musicHelpSelect' && i.customId !== 'utilityHelpSelect') return;

            const cmd = commands.find(x => x.name === i.values[0]);
            const usage = `${cmd.description}\n\`\`\`${prefix}${cmd.usage}\`\`\``;

            i.deferUpdate();
            await msg.edit({
                embeds: [embeds.help(bot, title!, usage)],
                components: [],
                allowedMentions: { repliedUser: false }
            })
                .catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));

            return collector.stop();
        });

        collector.on('end', async (collected: Collection<string, ButtonInteraction>, reason: string) => {
            if (reason == 'time' && collected.size == 0) {
                await msg.edit({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:ERROR_TIME_EXPIRED'))],
                    components: [],
                    allowedMentions: { repliedUser: false }
                })
                    .catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));
            }
        });
    }
    else {
        const helpCmd = command;
        const commands = client.commands.filter(x => x.showHelp !== false);

        let found = false;
        found = commands.find(x => {
            if (helpCmd === x.name || x.aliases.includes(helpCmd)) {
                const command = x.name;
                const description = `${x.description}\n\`\`\`${prefix}${x.usage}\`\`\``;

                interaction.editReply({
                    embeds: [embeds.help(bot, command, description)],
                    allowedMentions: { repliedUser: false }
                });
                return true;
            }
        });

        if (!found) return interaction.editReply({ embeds: [embeds.textErrorMsg(bot, client.i18n.t('commands:MESSAGE_HELP_NOT_FOUND'))], allowedMentions: { repliedUser: false } });
    }
};