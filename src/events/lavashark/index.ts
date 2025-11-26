import { ErrorEvent } from './ErrorEvent.js';
import { NodeConnectEvent } from './NodeConnectEvent.js';
import { NodeDisconnectEvent } from './NodeDisconnectEvent.js';
import { NodeResumeEvent } from './NodeResumeEvent.js';
import { PlayerConnectEvent } from './PlayerConnectEvent.js';
import { PlayerDestroyEvent } from './PlayerDestroyEvent.js';
import { QueueEndEvent } from './QueueEndEvent.js';
import { TrackAddEvent } from './TrackAddEvent.js';
import { TrackEndEvent } from './TrackEndEvent.js';
import { TrackStartEvent } from './TrackStartEvent.js';

import type { LavaSharkEventRegistry } from './base/LavaSharkEventRegistry.js';
import type { Bot } from '../../@types/index.js';


/**
 * Register all LavaShark events to the registry
 * 
 * @param registry - LavaShark event registry instance
 * @param bot - Bot instance
 */
export function registerAllLavaSharkEvents(registry: LavaSharkEventRegistry, bot: Bot): void {
    // Node events
    registry.register(new ErrorEvent());
    registry.register(new NodeConnectEvent());
    registry.register(new NodeDisconnectEvent());
    registry.register(new NodeResumeEvent());

    // Player events
    registry.register(new PlayerConnectEvent());
    registry.register(new PlayerDestroyEvent());

    // Track events
    registry.register(new QueueEndEvent());
    registry.register(new TrackAddEvent());
    registry.register(new TrackEndEvent());
    registry.register(new TrackStartEvent());
}
