import {
    ActionRowBuilder,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Client,
    Collection,
    Message,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction
} from "discord.js";
import { embeds } from "../embeds";

import type { Bot } from "../@types";


export const name = 'help';
export const aliases = ['h'];
export const description = 'Get commands help';
export const usage = 'help [command]';
export const voiceChannel = false;
export const showHelp = true;
export const sendTyping = true;
export const requireAdmin = false;
export const options = [
    {
        name: "command",
        description: "which command need help",
        type: 3,
        required: false
    }
];


export const execute = async (bot: Bot, client: Client, message: Message, args: string[]) => {
    const prefix = bot.config.prefix;

    if (!args[0]) {
        const title = client.user?.username;
        const commands = client.commands.filter(x => x.showHelp !== false);

        const select = new StringSelectMenuBuilder()
            .setCustomId("helpSelect")
            .setPlaceholder("Select the help")
            .setOptions(commands.map(x => {
                return {
                    label: x.name,
                    description: `Aliases: ${x.aliases[0] ? x.aliases.map((y: string) => y).join(', ') : x.name}`,
                    value: x.name
                };
            }));
        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
        const msg = await message.reply({
            content: 'Choose a command to get help. ⬇️',
            components: [row.toJSON()],
            allowedMentions: { repliedUser: false }
        });

        const collector = msg.createMessageComponentCollector({
            time: 20000, // 20s
            filter: i => i.user.id === message.author.id
        });

        collector.on("collect", async (i: StringSelectMenuInteraction) => {
            if (i.customId != "helpSelect") return;

            const cmd = commands.find(x => x.name === i.values[0]);
            const usage = `${cmd.description}\n\`\`\`${prefix}${cmd.usage}\`\`\``;

            i.deferUpdate();
            await msg.edit({
                embeds: [embeds.help(bot.config.embedsColor, title!, usage)],
                components: [],
                allowedMentions: { repliedUser: false }
            })
                .catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));

            return collector.stop();
        });

        collector.on("end", async (collected: Collection<string, ButtonInteraction>, reason: string) => {
            if (reason == "time" && collected.size == 0) {
                await msg.edit({
                    content: "❌ | Time expired.",
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
                    embeds: [embeds.help(bot.config.embedsColor, command, description)],
                    allowedMentions: { repliedUser: false }
                });
                return true;
            }
        });

        if (!found) return message.reply({ content: '❌ | The command not found.', allowedMentions: { repliedUser: false } });
    }
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const prefix = bot.config.prefix;
    const command = interaction.options.getString("command");

    if (!command) {
        const title = client.user?.username;
        const commands = client.commands.filter(x => x.showHelp !== false);

        const select = new StringSelectMenuBuilder()
            .setCustomId("helpSelect")
            .setPlaceholder("Select the help")
            .setOptions(commands.map(x => {
                return {
                    label: x.name,
                    description: `Aliases: ${x.aliases[0] ? x.aliases.map((y: string) => y).join(', ') : x.name}`,
                    value: x.name
                };
            }));
        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
        const msg = await interaction.editReply({
            content: 'Choose a command to get help. ⬇️',
            components: [row.toJSON()],
            allowedMentions: { repliedUser: false }
        });

        const collector = msg.createMessageComponentCollector({
            time: 20000, // 20s
            filter: i => i.user.id === interaction.user.id
        });

        collector.on("collect", async (i: StringSelectMenuInteraction) => {
            if (i.customId != "helpSelect") return;

            const cmd = commands.find(x => x.name === i.values[0]);
            const usage = `${cmd.description}\n\`\`\`${prefix}${cmd.usage}\`\`\``;

            i.deferUpdate();
            await msg.edit({
                embeds: [embeds.help(bot.config.embedsColor, title!, usage)],
                components: [],
                allowedMentions: { repliedUser: false }
            })
                .catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));

            return collector.stop();
        });

        collector.on("end", async (collected: Collection<string, ButtonInteraction>, reason: string) => {
            if (reason == "time" && collected.size == 0) {
                await msg.edit({
                    content: "❌ | Time expired.",
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
                    embeds: [embeds.help(bot.config.embedsColor, command, description)],
                    allowedMentions: { repliedUser: false }
                });
                return true;
            }
        });

        if (!found) return interaction.editReply({ content: '❌ | The command not found.', allowedMentions: { repliedUser: false } });
    }
};