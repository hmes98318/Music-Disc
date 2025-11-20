import { PingCommand } from './PingCommand.js';
import { PauseCommand } from './PauseCommand.js';
import { SkipCommand } from './SkipCommand.js';
import { HelpCommand } from './HelpCommand.js';
import { NowPlayingCommand } from './NowPlayingCommand.js';
import { StopCommand } from './StopCommand.js';
import { ResumeCommand } from './ResumeCommand.js';
import { ShuffleCommand } from './ShuffleCommand.js';
import { LoopCommand } from './LoopCommand.js';
import { RemoveCommand } from './RemoveCommand.js';
import { MoveCommand } from './MoveCommand.js';
import { SeekCommand } from './SeekCommand.js';
import { ClearCommand } from './ClearCommand.js';
import { JoinCommand } from './JoinCommand.js';
import { LeaveCommand } from './LeaveCommand.js';
import { LanguageCommand } from './LanguageCommand.js';
import { DjCommand } from './DjCommand.js';
import { ServerCommand } from './ServerCommand.js';
import { StatusCommand } from './StatusCommand.js';
import { NodeStatusCommand } from './NodeStatusCommand.js';
import { QueueCommand } from './QueueCommand.js';
import { FilterCommand } from './FilterCommand.js';
import { DashboardCommand } from './DashboardCommand.js';
import { VolumeCommand } from './VolumeCommand.js';
import { SearchCommand } from './SearchCommand.js';
import { PlayFirstCommand } from './PlayFirstCommand.js';
import { PlayCommand } from './PlayCommand.js';

import type { CommandRegistry } from './base/CommandRegistry.js';
import type { Bot } from '../@types/index.js';


/**
 * Register all commands to the registry
 * 
 * @param registry - Command registry instance
 * @param bot - Bot instance
 */
export function registerAllCommands(registry: CommandRegistry, bot: Bot): void {
    // Utility commands
    registry.register(new PingCommand(), bot);
    registry.register(new HelpCommand(), bot);
    registry.register(new LanguageCommand(), bot);
    registry.register(new DjCommand(), bot);
    registry.register(new ServerCommand(), bot);
    registry.register(new StatusCommand(), bot);
    registry.register(new NodeStatusCommand(), bot);

    // Music commands
    registry.register(new PauseCommand(), bot);
    registry.register(new SkipCommand(), bot);
    registry.register(new NowPlayingCommand(), bot);
    registry.register(new StopCommand(), bot);
    registry.register(new ResumeCommand(), bot);
    registry.register(new ShuffleCommand(), bot);
    registry.register(new LoopCommand(), bot);
    registry.register(new RemoveCommand(), bot);
    registry.register(new MoveCommand(), bot);
    registry.register(new SeekCommand(), bot);
    registry.register(new ClearCommand(), bot);
    registry.register(new JoinCommand(), bot);
    registry.register(new LeaveCommand(), bot);
    registry.register(new QueueCommand(), bot);
    registry.register(new FilterCommand(), bot);
    registry.register(new DashboardCommand(), bot);
    registry.register(new VolumeCommand(), bot);
    registry.register(new SearchCommand(), bot);
    registry.register(new PlayFirstCommand(), bot);
    registry.register(new PlayCommand(), bot);
}
