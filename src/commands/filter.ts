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
import { filtersConfig } from "../utils/constants";

import type { Bot } from "../@types";


export const name = 'filter';
export const aliases = ['eq', 'equalizer'];
export const description = 'Set music filter';
export const usage = 'filter [effect name]';
export const voiceChannel = true;
export const showHelp = true;
export const sendTyping = true;
export const requireAdmin = false;
export const options = [
    {
        name: "filter",
        description: "Select the music filter mode you want to set.",
        type: 3,
        required: true,
        choices: [
            ...(Object.keys(filtersConfig).map((effectName) => {
                return {
                    name: effectName,
                    value: effectName
                };
            })),
            { name: 'clear', value: 'clear' }
        ]
    }
];


export const execute = async (bot: Bot, client: Client, message: Message, args: string[]) => {
    const player = client.lavashark.getPlayer(message.guild!.id);

    if (!player) {
        return message.reply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }


    if (!args[0]) {
        const select = new StringSelectMenuBuilder()
            .setCustomId("filterSelect")
            .setPlaceholder("Select filter mode")
            .setOptions([
                ...(Object.keys(filtersConfig).map((effectName) => {
                    return {
                        label: effectName,
                        value: effectName
                    };
                })),
                { label: 'clear', value: 'clear' }
            ]);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
        const msg = await message.reply({
            content: 'Select the music filter mode you want to set. ⬇️',
            components: [row.toJSON()],
            allowedMentions: { repliedUser: false }
        });

        const collector = msg.createMessageComponentCollector({
            time: 20000, // 20s
            filter: i => i.user.id === message.author.id
        });

        collector.on("collect", async (i: StringSelectMenuInteraction) => {
            if (i.customId !== "filterSelect") return;

            const effectName = i.values[0];

            if (effectName === 'clear') {
                player.filters.clear();
            }
            else {
                if (!Object.keys(filtersConfig).includes(effectName)) {
                    return message.reply({
                        content: '❌ | The effect name not found.',
                        embeds: [],
                        allowedMentions: { repliedUser: false }
                    });
                }

                player.filters.set(filtersConfig[(effectName as keyof typeof filtersConfig)]);
            }


            await message.react('👍');

            i.deferUpdate();
            await msg.edit({
                content: '',
                embeds: [embeds.filterMsg(bot.config.embedsColor, effectName)],
                components: [],
                allowedMentions: { repliedUser: false }
            })
                .catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));

            return collector.stop();
        });

        collector.on("end", async (collected: Collection<string, ButtonInteraction>, reason: string) => {
            if (reason === "time" && collected.size === 0) {
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
        const effectName = String(args[0]).toLowerCase();

        if (effectName === 'clear') {
            player.filters.clear();
        }
        else if (!Object.keys(filtersConfig).includes(effectName)) {
            return message.reply({ content: '❌ | The effect name not found.', allowedMentions: { repliedUser: false } });
        }


        player.filters.set(filtersConfig[(effectName as keyof typeof filtersConfig)]);

        return message.react('👍');
    }
};

export const slashExecute = async (bot: Bot, client: Client, interaction: ChatInputCommandInteraction) => {
    const player = client.lavashark.getPlayer(interaction.guild!.id);

    if (!player) {
        return interaction.editReply({ content: '❌ | There is no music currently playing.', allowedMentions: { repliedUser: false } });
    }


    const effectName = interaction.options.getString("filter");

    if (effectName === 'clear') {
        player.filters.clear();
    }
    else {
        player.filters.set(filtersConfig[(effectName as keyof typeof filtersConfig)]);
    }


    return interaction.editReply({
        content: '',
        embeds: [embeds.filterMsg(bot.config.embedsColor, effectName ?? 'unknown')],
        components: [],
        allowedMentions: { repliedUser: false }
    })
        .catch(() => bot.logger.emit('discord', bot.shardId, 'Failed to edit deleted message.'));
};