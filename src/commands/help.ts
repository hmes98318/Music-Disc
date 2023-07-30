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


export const name = 'help';
export const aliases = ['h'];
export const description = 'Get commands help';
export const usage = 'help [command]';
export const voiceChannel = false;
export const showHelp = true;
export const sendTyping = true;
export const options = [
    {
        name: "command",
        description: "which command need help",
        type: 3,
        required: false
    }
];


export const execute = async (client: Client, message: Message, args: string[]) => {
    const prefix = client.config.prefix;

    if (!args[0]) {
        let title = client.user?.username;
        const commands = client.commands.filter(x => x.showHelp !== false);

        let select = new StringSelectMenuBuilder()
            .setCustomId("helpSelect")
            .setPlaceholder("Select the help")
            .setOptions(commands.map(x => {
                return {
                    label: x.name,
                    description: `Aliases: ${x.aliases[0] ? x.aliases.map((y: string) => y).join(', ') : x.name}`,
                    value: x.name
                }
            }));
        let row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
        let msg = await message.reply({
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
                embeds: [embeds.help(client.config.embedsColor, title!, usage)],
                components: [],
                allowedMentions: { repliedUser: false }
            });
        });

        collector.on("end", async (collected: Collection<string, ButtonInteraction>, reason: string) => {
            if (reason == "time" && collected.size == 0) {
                await msg.edit({ content: "❌ | Time expired.", components: [], allowedMentions: { repliedUser: false } });
            }
        });
    }
    else {
        const helpCmd = args[0];
        const commands = client.commands.filter(x => x.showHelp !== false);

        let found = false;
        found = commands.find(x => {
            if (helpCmd === x.name || x.aliases.includes(helpCmd)) {
                let command = x.name
                let description = `${x.description}\n\`\`\`${prefix}${x.usage}\`\`\``;

                message.reply({
                    embeds: [embeds.help(client.config.embedsColor, command, description)],
                    allowedMentions: { repliedUser: false }
                });
                return true;
            }
        });

        if (!Boolean(found)) return message.reply({ content: '❌ | The command not found.', allowedMentions: { repliedUser: false } });
    }
}

export const slashExecute = async (client: Client, interaction: ChatInputCommandInteraction) => {
    const prefix = client.config.prefix;
    const command = interaction.options.getString("command");

    if (!command) {
        let title = client.user?.username;
        const commands = client.commands.filter(x => x.showHelp !== false);

        let select = new StringSelectMenuBuilder()
            .setCustomId("helpSelect")
            .setPlaceholder("Select the help")
            .setOptions(commands.map(x => {
                return {
                    label: x.name,
                    description: `Aliases: ${x.aliases[0] ? x.aliases.map((y: string) => y).join(', ') : x.name}`,
                    value: x.name
                }
            }));
        let row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
        let msg = await interaction.editReply({
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
                embeds: [embeds.help(client.config.embedsColor, title!, usage)],
                components: [],
                allowedMentions: { repliedUser: false }
            });
        });

        collector.on("end", async (collected: Collection<string, ButtonInteraction>, reason: string) => {
            if (reason == "time" && collected.size == 0) {
                await msg.edit({ content: "❌ | Time expired.", components: [], allowedMentions: { repliedUser: false } });
            }
        });
    }
    else {
        const helpCmd = command;
        const commands = client.commands.filter(x => x.showHelp !== false);

        let found = false;
        found = commands.find(x => {
            if (helpCmd === x.name || x.aliases.includes(helpCmd)) {
                let command = x.name
                let description = `${x.description}\n\`\`\`${prefix}${x.usage}\`\`\``;

                interaction.editReply({
                    embeds: [embeds.help(client.config.embedsColor, command, description)],
                    allowedMentions: { repliedUser: false }
                });
                return true;
            }
        });

        if (!Boolean(found)) return interaction.editReply({ content: '❌ | The command not found.', allowedMentions: { repliedUser: false } });
    }
}