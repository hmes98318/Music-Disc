import { BasePlaylistSubcommand } from './BasePlaylistSubcommand.js';
import { PermissionFlagsBits } from 'discord.js';

import type {
    PlaylistSubcommandContext,
    PlaylistSubcommandName,
} from './BasePlaylistSubcommand.js';

export class ToggleM3uSubcommand extends BasePlaylistSubcommand {
    public readonly name: PlaylistSubcommandName = 'toggle-m3u';

    public async execute(context: PlaylistSubcommandContext): Promise<void> {
        const { bot, command } = context;
        const member = command.member;

        const isAdmin = bot.config.bot.admin.includes(command.user.id) ||
            member?.permissions.has(PermissionFlagsBits.Administrator) ||
            member?.permissions.has(PermissionFlagsBits.ManageGuild);

        if (!isAdmin) {
            await command.replyEphemeralError(
                bot,
                command.t('commands:MESSAGE_DJ_ADMIN_ONLY'),
            );
            return;
        }

        if (!bot.config.playlist) {
            bot.config.playlist = {
                enabled: true,
                allowM3uImport: false,
            };
        }

        bot.config.playlist.allowM3uImport = !bot.config.playlist.allowM3uImport;
        const state = bot.config.playlist.allowM3uImport ? 'ON' : 'OFF';

        await command.replySuccess(
            bot,
            command.t('commands:MESSAGE_PLAYLIST_TOGGLE_M3U_SUCCESS', { state }),
        );
    }
}
