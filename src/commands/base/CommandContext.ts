import { ChatInputCommandInteraction, Message } from 'discord.js';
import { embeds } from '../../embeds/index.js';

import type {
    EmbedBuilder,
    Guild,
    GuildMember,
    TextBasedChannel,
    User
} from 'discord.js';
import type { Bot } from '../../@types/index.js';


/**
 * Unified command context that abstracts Message and Interaction differences
 */
export class CommandContext {
    readonly #source: Message | ChatInputCommandInteraction;
    #args: string[];

    constructor(source: Message | ChatInputCommandInteraction, args: string[] = []) {
        this.#source = source;
        this.#args = args;
    }

    /**
     * Check if source is a Message (text command)
     */
    public isMessage(): boolean {
        return this.#source instanceof Message;
    }

    /**
     * Check if source is an Interaction (slash command)
     */
    public isInteraction(): boolean {
        return this.#source instanceof ChatInputCommandInteraction;
    }

    /**
     * Get the underlying Message (for text commands)
     * Should only be called after checking isMessage()
     * @throws Error if source is not a Message
     */
    public getMessage(): Message {
        if (this.#source instanceof Message) {
            return this.#source;
        }

        throw new Error('Source is not a Message. Check isMessage() before calling getMessage()');
    }

    /**
     * Get the underlying Interaction (for slash commands)
     * Should only be called after checking isInteraction()
     * @throws Error if source is not an Interaction
     */
    public getInteraction(): ChatInputCommandInteraction {
        if (this.#source instanceof ChatInputCommandInteraction) {
            return this.#source;
        }

        throw new Error('Source is not an Interaction. Check isInteraction() before calling getInteraction()');
    }

    /**
     * Get command arguments
     */
    public get args(): string[] {
        return this.#args;
    }

    /**
     * Get the user who invoked the command
     */
    public get user(): User {
        return this.#source instanceof Message
            ? this.#source.author
            : this.#source.user;
    }

    /**
     * Get the guild where command was invoked
     */
    public get guild(): Guild | null {
        return this.#source.guild;
    }

    /**
     * Get the guild member who invoked the command
     */
    public get member(): GuildMember | null {
        return this.#source.member as GuildMember | null;
    }

    /**
     * Get the channel where command was invoked
     */
    public get channel(): TextBasedChannel | null {
        return this.#source.channel;
    }

    /**
     * Get creation timestamp
     */
    public get createdTimestamp(): number {
        return this.#source.createdTimestamp;
    }

    /**
     * Get guild ID
     */
    public get guildId(): string | null {
        return this.#source.guildId;
    }

    /**
     * Send typing indicator
     */
    public async sendTyping(): Promise<void> {
        if (this.isMessage()) {
            const message = this.#source as Message;
            if ('sendTyping' in message.channel) {
                await message.channel.sendTyping();
            }
        }
        // Slash commands don't need typing indicator (already deferred)
    }

    /**
     * Reply to the command (works for both Message and Interaction)
     */
    public async reply(options: {
        embeds?: EmbedBuilder[];
        content?: string;
        components?: any[];
        allowedMentions?: { repliedUser: boolean };
    }): Promise<Message> {
        const replyOptions = {
            ...options,
            allowedMentions: options.allowedMentions ?? { repliedUser: false }
        };

        const source = this.#source;

        if (source instanceof Message) {
            return await (source as Message).reply(replyOptions);
        }
        else {
            return await (source as ChatInputCommandInteraction).editReply(replyOptions) as Message;
        }
    }

    /**
     * Reply with a success message
     */
    public async replySuccess(bot: Bot, message: string): Promise<Message> {
        return await this.reply({
            embeds: [embeds.textSuccessMsg(bot, message)]
        });
    }

    /**
     * Reply with an error message
     */
    public async replyError(bot: Bot, message: string): Promise<Message> {
        return await this.reply({
            embeds: [embeds.textErrorMsg(bot, message)]
        });
    }

    /**
     * Reply with a warning message
     */
    public async replyWarning(bot: Bot, message: string): Promise<Message> {
        return await this.reply({
            embeds: [embeds.textWarningMsg(bot, message)]
        });
    }

    /**
     * Reply with a text message
     */
    public async replyText(bot: Bot, message: string): Promise<Message> {
        return await this.reply({
            embeds: [embeds.textMsg(bot, message)]
        });
    }

    /**
     * React to the message (only works for text commands)
     */
    public async react(emoji: string): Promise<void> {
        if (this.isMessage()) {
            await (this.#source as Message).react(emoji);
        }
    }

    /**
     * Get integer option from slash command
     */
    public getIntegerOption(name: string): number | null {
        if (this.isInteraction()) {
            return (this.#source as ChatInputCommandInteraction).options.getInteger(name);
        }
        return null;
    }

    /**
     * Get string option from slash command
     */
    public getStringOption(name: string): string | null {
        if (this.isInteraction()) {
            return (this.#source as ChatInputCommandInteraction).options.getString(name);
        }
        return null;
    }

    /**
     * Get boolean option from slash command
     */
    public getBooleanOption(name: string): boolean | null {
        if (this.isInteraction()) {
            return (this.#source as ChatInputCommandInteraction).options.getBoolean(name);
        }
        return null;
    }
}
