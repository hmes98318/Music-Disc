import type { LoginType } from "../@types";


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
            loginType           : 'USER' as LoginType,              // "USER" | 'OAUTH2'
            username            : 'admin',
            password            : 'password',
            oauth2Link          : null,                             // OAuth2 URL
            oauth2RedirectUri   : `http://localhost:33333/login`    // Redirect link after OAuth2 authentication is complete
        },
        enableLocalNode         : false,
        localNode: {
            autoRestart         : true,
            downloadLink        : 'https://github.com/lavalink-devs/Lavalink/releases/download/3.7.12/Lavalink.jar'
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
    }
};