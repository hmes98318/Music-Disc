import { ClientReadyEvent } from './ClientReadyEvent.js';
import { InteractionCreateEvent } from './InteractionCreateEvent.js';
import { MessageCreateEvent } from './MessageCreateEvent.js';
import { RawEvent } from './RawEvent.js';
import { VoiceStateUpdateEvent } from './VoiceStateUpdateEvent.js';

import type { DiscordEventRegistry } from './base/DiscordEventRegistry.js';
import type { Bot } from '../../@types/index.js';


/**
 * Register all Discord events to the registry
 *
 * @param registry - Event registry instance
 * @param bot - Bot instance
 */
export function registerAllDiscordEvents(registry: DiscordEventRegistry, bot: Bot): void {
    // Core events
    registry.register(new ClientReadyEvent(), bot);
    registry.register(new RawEvent(), bot);

    // Command events
    if (bot.config.bot.textCommand) {
        registry.register(new MessageCreateEvent(), bot);
    }
    if (bot.config.bot.slashCommand) {
        registry.register(new InteractionCreateEvent(), bot);
    }

    // Voice events
    registry.register(new VoiceStateUpdateEvent(), bot);
}
