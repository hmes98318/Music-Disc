import { ActivityType, ClientPresenceStatus } from 'discord.js';
import { LoginType, DJModeEnum } from '../@types/index.js';


/**
 * Constants variables
 */
export const cst = {
    // Default config
    config: {
        bot: {
            textCommand             : true,                 // Whether to enable text command
            slashCommand            : true,                 // Whether to enable slash command
    
            // OAUTH2 mode requires setting 'admin', 'clientSecret' value
            admin                   : [],                   // Admin users, It must be the user ID (string[])

            /**
             * DYNAMIC mode: The first user to execute a command becomes the DJ
             * STATIC mode: The DJ is determined by the config file
             */
            djMode                  : DJModeEnum.DYNAMIC,   // DJ mode: 'STATIC' (config.js based) or 'DYNAMIC' (first user to execute command based)
            dj                      : [],                   // DJ users, It must be the user ID (string[])
            djRoleId                : null,                 // DJ role ID, members with this role have DJ permissions
            djLeaveCooldown         : 5000,                 // Automatically assign a cooldown time (ms) to a new DJ after the DJ leaves in DYNAMIC mode (default: 5000ms)

            clientSecret            : '',
    
            name                    : 'Music Disc',
            prefix                  : '+',
            status                  : ('online' as ClientPresenceStatus),       // 'online' | 'idle' | 'dnd'
            activity: {
                type                : ActivityType.Playing,                     // https://discord.com/developers/docs/topics/gateway-events#activity-object-activity-types
                name                : '+help | music',
                state               : undefined,
                url                 : undefined,
            },
            embedsColors: {
                message             : '#FFFFFF',            // Message embed color
                success             : '#FFFFFF',            // Success embed color
                error               : '#FF0000',            // Error embed color
                warning             : '#FFFF00',            // Warning embed color
            },
            volume: {
                default             : 50,
                max                 : 100,
            },
            // Auto leave channel settings
            autoLeave: {
                enabled             : true,
                cooldown            : 5000,         // ms
            },
            // Show voice channel updates
            displayVoiceState       : true,

            // Specify the text channel for receiving commands.
            // If this value is set, text messages from other channels will not be processed.
            specifyMessageChannel   : null,         // Text channel ID

            // Specify the voice channel to join.
            // If this value is set, other voice channels will not be joined.
            specifyVoiceChannel     : null,         // Vioce channel ID

            // After starting the Bot, it will automatically join the specified voice channel and wait.
            // The specifyVoiceChannel value needs to be set, otherwise it will be invalid.
            startupAutoJoin         : false,

            // Language settings
            i18n: {
                localePath          : '../../locales',
                defaultLocale       : 'en-US'
            }
        },

        // Lavalink node list
        nodeList: [
            {
                id: 'Node 1',
                hostname: 'localhost',
                port: 2333,
                password: 'youshallnotpass'
            }
        ],

        spotify: {
            clientId: null,             // If you want to use Spotify to play songs, you need to set up Spotify credentials.
            clientSecret: null          // https://developer.spotify.com/documentation/web-api
        },

        blacklist               : [],           // It must be the user ID (string[])

        // Web dashboard settings
        webDashboard: {
            enabled                 : true,
            port                    : 33333,
            loginType               : ('USER' as LoginType),    // 'USER' | 'OAUTH2'
    
            // USER mode settings
            user: {
                username            : 'admin',
                password            : 'password',
            },
    
            // OAUTH2 mode settings
            oauth2: {
                link                : '',
                redirectUri         : 'http://localhost:33333/login',
            },
    
            // SessionManager config
            sessionManager: {
                validTime           : 10 * 60 * 1000,           // Session validity time (ms) (default: 10 minutes)
                cleanupInterval     : 5 * 60 * 1000             // Timing cleaner time (ms) (default: 5 minutes)
            },
            // IPBlocker config
            ipBlocker: {
                retryLimit              : 5,                    // Maximum number of retries (default: 5)
                unlockTimeoutDuration   : 5 * 60 * 1000,        // Blocking time (ms) (default: 5 minutes)
                cleanupInterval         : 5 * 60 * 1000         // Timing cleaner time (ms) (default: 5 minutes)
            }
        },
    
        // Local Lavalink node
        localNode: {
            enabled             : false,
            autoRestart         : true,
            downloadLink        : 'https://github.com/lavalink-devs/Lavalink/releases/download/4.0.8/Lavalink.jar'
        },

        // Command permission settings
        command: {
            disableCommand      : [],                                   // Disabled commands, all enabled by default
            adminCommand        : ['language','server', 'status'],      // Admin commands, only Admin role user can use
            djCommand           : ['dj']                                // DJ commands, only DJ role user can use
        }
    },

    // Console color
    color: {
        cyan    : '\x1B[36m',
        green   : '\x1B[32m',
        grey    : '\x1B[2m',
        red     : '\x1B[31m',
        white   : '\x1B[0m',
        yellow  : '\x1B[33m'
    },
    // Dashboard button icon
    button: {
        play        : '<:w_play:1106270709644271656>',
        pause       : '<:w_pause:1106270708243386428>',
        skip        : '<:w_skip:1106270714664849448>',
        back        : '<:w_back:1106270704049061928>',
        stop        : '<:w_stop:1106272001909346386>',
        loop        : '<:w_loop:1106270705575792681>',
        shuffle     : '<:w_shuffle:1106270712542531624>',
        prev        : '<:w_prev:1153665768093921280>',
        next        : '<:w_next:1153665809990815874>',
        delete      : 'Delete Message',
        clear       : 'Clear Queue'
    },
    // Logger
    logger: {
        format      : 'YYYY-MM-DD HH:mm:ss',            // Time format 'YYYY-MM-DD HH(hh):mm:ss.l'
        logDir      : './logs'
    },
    cacheExpiration : 30 * 60 * 1000            // stats cache validity time (default: 30 minutes)
};


/**
 * Music filter config
 * (Filter name all lowercase)
 */
export const filtersConfig = {
    bass: {
        equalizer: [
            0.25,   // 25 Hz
            0.2,    // 40 Hz
            0.1,    // 63 Hz
            0.1,    // 100 Hz
            0.05,   // 160 Hz
            0.0,    // 250 Hz
            -0.05,  // 400 Hz
            -0.1,   // 630 Hz
            0.0,    // 1000 Hz
            0.0,    // 1600 Hz
            0.0,    // 2500 Hz
            0.0,    // 4000 Hz
            0.0,    // 6300 Hz
            0.0,    // 10000 Hz
            0.0     // 16000 Hz
        ]
    },
    karaoke: {
        karaoke: {
            level: 0.8,
            monoLevel: 1.0,
            filterBand: 220.0,
            filterWidth: 100.0,
        }
    },
    lowpass: {
        lowPass: { smoothing: 15 }
    },
    nightcore: {
        equalizer: [
            0.3,   // 25 Hz
            0.3,   // 40 Hz
            0.2,   // 63 Hz
            0.1,   // 100 Hz
            0.0,   // 160 Hz
            0.0,   // 250 Hz
            0.0,   // 400 Hz
            0.0,   // 630 Hz
            0.0,   // 1000 Hz
            0.1,   // 1600 Hz
            0.2,   // 2500 Hz
            0.2,   // 4000 Hz
            0.1,   // 6300 Hz
            -0.1,  // 10000 Hz
            -0.2   // 16000 Hz
        ],
        timescale: { pitch: 1.2, rate: 1.15 },
        tremolo: { depth: 0.2, frequency: 12 }
    },
    soft: {
        equalizer: [
            0.1,   // 25 Hz
            0.1,   // 40 Hz
            0.1,   // 63 Hz
            0.0,   // 100 Hz
            0.0,   // 160 Hz
            0.0,   // 250 Hz
            0.0,   // 400 Hz
            -0.1,  // 630 Hz
            -0.2,  // 1000 Hz
            0.0,   // 1600 Hz
            0.0,   // 2500 Hz
            0.0,   // 4000 Hz
            0.0,   // 6300 Hz
            0.0,   // 10000 Hz
            0.0    // 16000 Hz
        ],
        lowPass: { smoothing: 5 }   // 使用低通濾波器，平滑高頻
    },
    vaporwave: {
        equalizer: [
            0.2,   // 25 Hz
            0.2,   // 40 Hz
            0.1,   // 63 Hz
            0.0,   // 100 Hz
            -0.1,  // 160 Hz
            -0.1,  // 250 Hz
            0.0,   // 400 Hz
            0.0,   // 630 Hz
            0.1,   // 1000 Hz
            0.2,   // 1600 Hz
            0.3,   // 2500 Hz
            0.2,   // 4000 Hz
            0.1,   // 6300 Hz
            0.0,   // 10000 Hz
            -0.1   // 16000 Hz
        ],
        timescale: { pitch: 0.9, rate: 0.95 },  // 輕微降低音高和速度
        tremolo: { depth: 0.1, frequency: 6 }
    }
};