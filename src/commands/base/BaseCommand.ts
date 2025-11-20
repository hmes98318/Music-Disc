import type { Client } from 'discord.js';

import type { CommandContext } from './CommandContext.js';
import type { Bot, CommandMetadata } from '../../@types/index.js';


/**
 * Abstract base class for all commands
 * Provides unified command execution
 */
export abstract class BaseCommand {
    /**
     * Get command metadata
     */
    public abstract getMetadata(bot: Bot): CommandMetadata;

    /**
     * Execute command logic (implemented by subclasses)
     * @param bot - Bot instance
     * @param client - Discord client
     * @param context - Unified command context
     */
    protected abstract run(bot: Bot, client: Client, context: CommandContext): Promise<void>;

    /**
     * Unified command execution entry point
     * Handles permissions, error handling, and delegates to run()
     */
    public async execute(bot: Bot, client: Client, context: CommandContext): Promise<void> {
        try {
            // Send typing indicator if enabled
            const metadata = this.getMetadata(bot);
            if (metadata.sendTyping) {
                await context.sendTyping();
            }

            // Execute command logic
            await this.run(bot, client, context);
        } catch (error) {
            bot.logger.emit('error', bot.shardId, `[${this.getMetadata(bot).name}] Command error: ${error}`);

            try {
                await context.replyError(bot, client.i18n.t('events:ERROR_COMMAND_EXECUTION'));
            } catch (replyError) {
                bot.logger.emit('error', bot.shardId, `Failed to send error message: ${replyError}`);
            }
        }
    }
}
