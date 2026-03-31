import { BaseCommand } from './BaseCommand.js';
import type { Bot } from '../../@types/index.js';


/**
 * Command registry for managing all bot commands
 */
export class CommandRegistry {
    #commands = new Map<string, BaseCommand>();
    #aliases = new Map<string, string>();   // alias -> command name

    /**
     * Register a command
     */
    public register(command: BaseCommand, bot: Bot): void {
        const metadata = command.getMetadata(bot);
        const commandName = metadata.name.toLowerCase();

        // Register main command name
        this.#commands.set(commandName, command);

        // Register aliases
        for (const alias of metadata.aliases) {
            this.#aliases.set(alias.toLowerCase(), commandName);
        }
    }

    /**
     * Get command by name or alias
     */
    public get(nameOrAlias: string): BaseCommand | undefined {
        const name = nameOrAlias.toLowerCase();

        // Try direct lookup
        const command = this.#commands.get(name);
        if (command) return command;

        // Try alias lookup
        const aliasedName = this.#aliases.get(name);
        if (aliasedName) {
            return this.#commands.get(aliasedName);
        }

        return undefined;
    }

    /**
     * Check if command exists
     */
    public has(nameOrAlias: string): boolean {
        return this.get(nameOrAlias) !== undefined;
    }

    /**
     * Get all registered commands
     */
    public getAll(): BaseCommand[] {
        return Array.from(this.#commands.values());
    }

    /**
     * Get all command names
     */
    public getAllNames(): string[] {
        return Array.from(this.#commands.keys());
    }

    /**
     * Get commands by category
     */
    public getByCategory(category: string, bot: Bot): BaseCommand[] {
        return this.getAll().filter(cmd =>
            cmd.getMetadata(bot).category === category
        );
    }

    /**
     * Get all commands that should be shown in help
     */
    public getHelpCommands(bot: Bot): BaseCommand[] {
        return this.getAll().filter(cmd =>
            cmd.getMetadata(bot).showHelp
        );
    }
}
