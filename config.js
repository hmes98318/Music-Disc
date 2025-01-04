/**
 * @type {import('./src/@types/index').Config} - Bot config
 */
const config = {
    bot: {
        textCommand             : true,                 // Whether to enable text command
        slashCommand            : true,                 // Whether to enable slash command

        // OAUTH2 mode requires setting 'admin', 'clientSecret' value
        admin                   : [],                   // It must be the user ID (string[])
        clientSecret            : '',

        name                    : 'Music Disc',
        prefix                  : '-',
        status                  : 'online',             // 'online' | 'idle' | 'dnd'
        activity: {
            type                : 0,                    // https://discord.com/developers/docs/topics/gateway-events#activity-object-activity-types
            name                : '+help | music',
            // state               : '',
            // url                 : '',                // The streaming type currently only supports Twitch and YouTube. Only https://twitch.tv/ and https://youtube.com/ urls will work.
        },
        embedsColor             : '#FFFFFF',
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
    },

    // Web dashboard settings
    webDashboard: {
        enabled                 : true,
        port                    : 33333,
        loginType               : 'USER',       // 'USER' | 'OAUTH2'

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
        // downloadLink        : 'https://github.com/lavalink-devs/Lavalink/releases/download/4.0.8/Lavalink.jar'
    }
};

export { config };