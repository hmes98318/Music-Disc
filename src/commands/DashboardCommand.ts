import i18next from 'i18next';
import { BaseCommand } from './base/BaseCommand.js';
import { CommandCategory } from '../@types/index.js';

import type { Client } from 'discord.js';
import type { CommandContext } from './base/CommandContext.js';
import type { Bot, CommandMetadata } from '../@types/index.js';


export class DashboardCommand extends BaseCommand {
    public getMetadata(_bot: Bot): CommandMetadata {
        return {
            name: 'dashboard',
            aliases: ['d', 'console'],
            description: i18next.t('commands:CONFIG_DASHBOARD_DESCRIPTION'),
            usage: i18next.t('commands:CONFIG_DASHBOARD_USAGE'),
            category: CommandCategory.MUSIC,
            voiceChannel: true,
            showHelp: true,
            sendTyping: false,
            options: []
        };
    }

    protected async run(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        const player = client.lavashark.getPlayer(context.guild!.id);

        if (!player || !player.dashboardMsg) {
            await context.replyError(bot, client.i18n.t('commands:ERROR_NO_PLAYING'));
            return;
        }

        // Delete old dashboard
        try {
            await player.dashboardMsg.delete();
        } catch (error) {
            bot.logger.emit('error', bot.shardId, 'Dashboard delete error:' + error);
        }

        // Initialize new dashboard
        if (context.isMessage()) {
            await client.dashboard.initialize(context.getMessage(), player);
        }
        else {
            await client.dashboard.initialize(context.getInteraction(), player);
        }

        // Update dashboard if there's a current track
        if (player.current) {
            await client.dashboard.update(player, player.current);
        }

        if (context.isMessage()) {
            await context.react('👍');
        }
        else {
            await context.replySuccess(bot, client.i18n.t('commands:MESSAGE_DASHBOARD_SUCCESS'));
        }
    }
}
