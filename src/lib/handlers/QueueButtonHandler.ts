import { ButtonsBuilder } from '../builders/ButtonsBuilder.js';
import { embeds } from '../../embeds/index.js';
import { PermissionManager } from '../PermissionManager.js';

import type { Client, ButtonInteraction, GuildMember } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * Handler for queue-related button interactions
 */
export class QueueButtonHandler {
    private static readonly QUEUE_PAGE_SIZE = 5;
    private static readonly LOOP_MODES = ['Off', 'Single', 'All'];

    /**
     * Handle queue previous page button
     */
    public static async handlePreviousPage(
        bot: Bot,
        client: Client,
        interaction: ButtonInteraction,
        player: Player
    ): Promise<void> {
        if (!player.setting.queuePage) return;

        if (player.setting.queuePage.curPage <= 1) {
            player.setting.queuePage.curPage = 1;
        } else {
            player.setting.queuePage.curPage--;
        }

        await this.updateQueueDisplay(bot, client, player);
        await interaction.deferUpdate();
    }

    /**
     * Handle queue next page button
     */
    public static async handleNextPage(
        bot: Bot,
        client: Client,
        interaction: ButtonInteraction,
        player: Player
    ): Promise<void> {
        if (!player.setting.queuePage) return;

        if (player.setting.queuePage.curPage >= player.setting.queuePage.maxPage) {
            player.setting.queuePage.curPage = player.setting.queuePage.maxPage;
        } else {
            player.setting.queuePage.curPage++;
        }

        await this.updateQueueDisplay(bot, client, player);
        await interaction.deferUpdate();
    }

    /**
     * Handle queue delete message button
     */
    public static async handleDelete(
        bot: Bot,
        client: Client,
        interaction: ButtonInteraction,
        player: Player
    ): Promise<void> {
        if (player.setting.queuePage?.msg) {
            await player.setting.queuePage.msg.delete().catch(() => { });
            player.setting.queuePage = null;
        }

        await interaction.deferUpdate();
    }

    /**
     * Handle queue clear button
     */
    public static async handleClear(
        bot: Bot,
        client: Client,
        interaction: ButtonInteraction,
        player: Player
    ): Promise<void> {
        // Check admin permission
        if (bot.config.command.adminCommand.includes('clear')) {
            if (!bot.config.bot.admin.includes(interaction.user.id)) {
                await interaction.reply({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_ADMIN'))],
                    ephemeral: true
                });
                return;
            }
        }

        // Check DJ permission
        if (bot.config.command.djCommand.includes('clear')) {
            const member = interaction.member as GuildMember;
            if (!PermissionManager.hasDJCommandPermission(bot, interaction.user.id, member, player)) {
                await interaction.reply({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_REQUIRE_DJ'))],
                    ephemeral: true
                });
                return;
            }
        }

        player.queue.clear();

        if (player.setting.queuePage) {
            player.setting.queuePage.curPage = 1;
            player.setting.queuePage.maxPage = 1;
        }

        await this.updateQueueDisplay(bot, client, player);

        await interaction.deferUpdate();
    }

    /**
     * Update queue display embed
     * @private
     */
    private static async updateQueueDisplay(
        bot: Bot,
        client: Client,
        player: Player
    ): Promise<void> {
        if (!player.setting.queuePage) return;

        const page = player.setting.queuePage.curPage;
        const startIdx = (page - 1) * this.QUEUE_PAGE_SIZE;
        const endIdx = page * this.QUEUE_PAGE_SIZE;
        const totalTracks = player.queue.tracks.length;
        const maxPage = player.setting.queuePage.maxPage;

        let maxTitleLength = 80;

        const buildDescription = (titleLength: number): string => {
            const nowPlayingTitle = player.current?.title || 'Unknown';
            const truncatedNP = nowPlayingTitle.length > titleLength
                ? nowPlayingTitle.substring(0, titleLength) + '...'
                : nowPlayingTitle;

            let desc = `**Now Playing:**\n${truncatedNP}\n${'─'.repeat(20)}\n`;

            const queueTracks = player.queue.tracks.slice(startIdx, endIdx);

            if (queueTracks.length < 1) {
                desc += '\n*No songs in queue*';
            } else {
                desc += '\n**Queue:**\n';
                const entries = queueTracks.map((track: any, index: number) => {
                    let title = track.title;
                    if (title.length > titleLength) {
                        title = title.substring(0, titleLength) + '...';
                    }
                    const requesterId = track.requester?.id;
                    const requesterMention = requesterId ? `<@${requesterId}>` : (track.requester?.username || client.i18n.t('commands:UNKNOWN_USER'));
                    return `${startIdx + index + 1}. ${title} **${track.duration.label}** | ${requesterMention}`;
                });
                desc += entries.join('\n');
            }

            if (totalTracks > 0 && maxPage > 1) {
                desc += `\n\n${client.i18n.t('events:MESSAGE_QUEUE_PAGE', { curPage: page, maxPage })}`;
            }

            return desc;
        };

        let description = buildDescription(maxTitleLength);

        while (description.length > 4000 && maxTitleLength > 10) {
            maxTitleLength -= 10;
            description = buildDescription(maxTitleLength);
        }

        if (description.length > 4096) {
            description = description.substring(0, 4093) + '...';
        }

        const repeatMode = player.repeatMode;
        const row = ButtonsBuilder.createQueueButtons();

        await player.setting.queuePage.msg?.edit({
            embeds: [embeds.queue(bot, description, this.LOOP_MODES[repeatMode])],
            components: [row],
            allowedMentions: { repliedUser: false }
        });
    }
}
