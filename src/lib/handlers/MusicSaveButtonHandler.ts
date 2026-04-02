import { MessageFlags } from 'discord.js';
import { embeds } from '../../embeds/index.js';
import type { Client, ButtonInteraction, GuildMember } from 'discord.js';
import type { Player } from 'lavashark';
import type { Bot } from '../../@types/index.js';


/**
 * Handler for music save button
 */
export class MusicSaveButtonHandler {
    public static async handle(
        bot: Bot,
        client: Client,
        interaction: ButtonInteraction,
        player: Player
    ): Promise<void> {
        const track = player.current;
        if (!track) return;

        const member = interaction.member as GuildMember;
        const subtitle = client.i18n.t('events:MESSAGE_NOW_PLAYING_SUBTITLE', {
            author: track.author,
            label: track.duration.label
        });

        member.user.send({ embeds: [embeds.save(bot, track.title, subtitle, track.uri, track.thumbnail!)] })
            .then(() => {
                interaction.reply({
                    embeds: [embeds.textSuccessMsg(bot, client.i18n.t('events:MESSAGE_SEND_PRIVATE_MESSAGE'))],
                    flags: MessageFlags.Ephemeral
                }).catch(() => { });
            })
            .catch((error) => {
                bot.logger.emit('error', bot.shardId, '[MusicSaveButtonHandler] Error sending DM: ' + error);
                interaction.reply({
                    embeds: [embeds.textErrorMsg(bot, client.i18n.t('events:ERROR_SEND_PRIVATE_MESSAGE'))],
                    flags: MessageFlags.Ephemeral
                }).catch(() => { });
            });
    }
}
