import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';
import i18next from 'i18next';

import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory, MusicButtonId } from '../@types/index.js';
import { embeds } from '../embeds/index.js';

import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class NowPlayingCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'nowplaying',
            aliases: ['np', 'save'],
            description: i18next.t('commands:CONFIG_NOW_PLAYING_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_NOW_PLAYING_USAGE'),
            category: CommandCategory.MUSIC,
            voiceChannel: false,
            showHelp: true,
            sendTyping: true,
            options: []
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const player = client.lavashark.getPlayer(context.guild!.id);

        if (!player || !player.playing) {
            await context.replyEphemeralError(bot, client.i18n.t('commands:ERROR_NO_PLAYING'));
            return;
        }

        const track = player.current;
        const requester = track?.requester;
        const requesterInfo = requester?.id ? ` | <@${requester.id}>` : '';
        const subtitle = client.i18n.t('commands:MESSAGE_NOW_PLAYING_SUBTITLE', {
            author: track?.author,
            label: track?.duration.label
        }) + requesterInfo;

        const saveButton = new ButtonBuilder()
            .setCustomId(MusicButtonId.Save)
            .setLabel(client.i18n.t('commands:MESSAGE_NOW_PLAYING_SAVE_BUTTON'))
            .setStyle(ButtonStyle.Success);
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(saveButton);

        await context.reply({
            embeds: [embeds.save(bot, track!.title, subtitle, track!.uri, track!.thumbnail!)],
            components: [row],
            allowedMentions: { repliedUser: false }
        });
    }
}
