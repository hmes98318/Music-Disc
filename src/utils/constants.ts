import { LoginType } from "../@types";


/**
 * Constants variables
 */
export const cst = {
    // Default config
    config: {
        admin                   : null,                 // It must be the user ID (string)
        clientSecret            : null,
        name                    : 'Music Disc',
        prefix                  : '+',
        status                  : 'online',             // 'online' | 'idle' | 'dnd'
        playing                 : '+help | music',
        embedsColor             : '#FFFFFF',
        slashCommand            : true,
        defaultVolume           : 50,
        maxVolume               : 100,
        autoLeave               : true,
        autoLeaveCooldown       : 5000,
        displayVoiceState       : true,
        enableSite              : true,
        site: {
            port                : 33333,
            loginType           : LoginType.USER,                   // "USER" | 'OAUTH2'
            username            : 'admin',
            password            : 'password',
            oauth2Link          : null,                             // OAuth2 URL
            oauth2RedirectUri   : `http://localhost:33333/login`    // Redirect link after OAuth2 authentication is complete
        },
        enableLocalNode         : false,
        localNode: {
            autoRestart         : true,
            downloadLink        : 'https://github.com/lavalink-devs/Lavalink/releases/download/4.0.8/Lavalink.jar'
        },
        // SessionManager config
        sessionManager: {
            validTime: 10 * 60 * 1000,          // Session validity time (ms) (default: 10 minutes)
            cleanupInterval: 5 * 60 * 1000      // Timing cleaner time (ms) (default: 5 minutes)
        },
        // IPBlocker config
        ipBlocker: {
            retryLimit: 5,                              // Maximum number of retries (default: 5)
            unlockTimeoutDuration: 5 * 60 * 1000,       // Blocking time (ms) (default: 5 minutes)
            cleanupInterval: 5 * 60 * 1000              // Timing cleaner time (ms) (default: 5 minutes)
        }
    },
    blacklist               : [],           // It must be the user ID (string[])
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