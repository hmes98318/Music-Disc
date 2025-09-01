import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';

import { cst } from '../utils/constants.js';
import { embeds } from '../embeds/index.js';
import { DJManager } from '../lib/DjManager.js';
import { DJModeEnum } from '../@types/index.js';

import type { Player, Track } from 'lavashark';
import type { Bot } from '../@types/index.js';


async function update(bot: Bot, player: Player, track: Track): Promise<void> {
    const playing = !(player.paused);
    const methods = ['OFF', 'SINGLE', 'ALL'];
    const repeatMode = player.repeatMode;
    const volume = player.volume;

    let subtitle = bot.i18n.t('embeds:DASHBOARD_SUBTITLE', { author: track.author, duration: track.duration.label, volume: volume, repeatMode: methods[repeatMode] });

    // Add DJ info in DYNAMIC mode
    if (bot.config.bot.djMode === DJModeEnum.DYNAMIC) {
        try {
            const client = player.dashboard?.client;
            if (client) {
                const djDisplay = await DJManager.getDJDisplayString(bot, client, player);
                subtitle += bot.i18n.t('embeds:DASHBOARD_DJ_INFO', { djDisplay });
            }
        } catch (_) {
            // Ignore errors in DJ display
        }
    }


    const playPauseButton = new ButtonBuilder().setCustomId('Dashboard-PlayPause').setEmoji(playing ? cst.button.pause : cst.button.play).setStyle(playing ? ButtonStyle.Secondary : ButtonStyle.Success);
    const skipButton = new ButtonBuilder().setCustomId('Dashboard-Skip').setEmoji(cst.button.skip).setStyle(ButtonStyle.Secondary);
    const stopButton = new ButtonBuilder().setCustomId('Dashboard-Stop').setEmoji(cst.button.stop).setStyle(ButtonStyle.Danger);
    const loopButton = new ButtonBuilder().setCustomId('Dashboard-Loop').setEmoji(cst.button.loop).setStyle(ButtonStyle.Secondary);
    const shuffleButton = new ButtonBuilder().setCustomId('Dashboard-Shuffle').setEmoji(cst.button.shuffle).setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(playPauseButton, skipButton, stopButton, loopButton, shuffleButton);

    try {
        await player.dashboard!.edit({
            embeds: [embeds.dashboard(bot, 'Dashboard', track!.title, subtitle, track!.uri, track!.thumbnail!)],
            components: [row]
        });
    } catch (error) {
        bot.logger.emit('error', bot.shardId, 'Dashboard error: ' + error);
    }
}

export { update };