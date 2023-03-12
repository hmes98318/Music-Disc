'use strict';

const fs = require('fs');

const dotenv = require('dotenv');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { Player } = require('discord-player');
const express = require('express');
require('console-stamp')(console, { format: ':date(yyyy/mm/dd HH:MM:ss)' });

const embed = require(`${__dirname}/embeds/embeds`);


dotenv.config();
const ENV = process.env;


let client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Channel],
    disableMentions: 'everyone',
});


client.config = {
    name: 'hoehoetvhs_Bot',
    prefix: ',',
    playing: ',helpㅣ음악을 재생',
    defaultVolume: 10,
    maxVolume: 200,
    autoLeave: true,
    autoLeaveCooldown: 3000,
    displayVoiceState: true,
    port: 33333
};

client.commands = new Collection();
client.player = new Player(client, {
    ytdlOptions: {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 27
    }
});

const player = client.player;
const color = {
    white: '\x1B[0m',
    grey: '\x1B[2m',
    green: '\x1B[32m'
};




const setEnvironment = () => {
    return new Promise((resolve, reject) => {
        client.config.name = typeof (ENV.BOT_NAME) === 'undefined' ?
            client.config.name :
            ENV.BOT_NAME;

        client.config.prefix = typeof (ENV.PREFIX) === 'undefined' ?
            client.config.prefix :
            ENV.PREFIX;

        client.config.playing = typeof (ENV.PLAYING) === 'undefined' ?
            client.config.playing :
            ENV.PLAYING;

        client.config.defaultVolume = typeof (ENV.DEFAULT_VOLUME) === 'undefined' ?
            client.config.defaultVolume :
            Number(ENV.DEFAULT_VOLUME);

        client.config.maxVolume = typeof (ENV.MAX_VOLUME) === 'undefined' ?
            client.config.maxVolume :
            Number(ENV.MAX_VOLUME);

        client.config.autoLeave = typeof (ENV.AUTO_LEAVE) === 'undefined' ?
            client.config.autoLeave :
            (String(ENV.AUTO_LEAVE) === 'true' ? true : false);

        client.config.autoLeaveCooldown = typeof (ENV.AUTO_LEAVE_COOLDOWN) === 'undefined' ?
            client.config.autoLeaveCooldown :
            Number(ENV.AUTO_LEAVE_COOLDOWN);

        client.config.displayVoiceState = typeof (ENV.DISPLAY_VOICE_STATE) === 'undefined' ?
            client.config.displayVoiceState :
            (String(ENV.DISPLAY_VOICE_STATE) === 'true' ? true : false);

        client.config.port = typeof (ENV.PORT) === 'undefined' ?
            client.config.port :
            Number(ENV.PORT);

        //console.log('setEnvironment: ', client.config);
        resolve();
    })
}


const loadFramework = () => {
    console.log(`-> 웹 프레임워크를 로드하는 중입니다...`);
    return new Promise((resolve, reject) => {
        const app = express();
        const port = client.config.port || 33333;

        app.get('/', function (req, res) {
            res.send('200 ok.')
        });

        app.listen(port, function () {
            console.log(`서버가 ${port}에서 수신 대기 포트를 시작합니다.`);
            resolve();
        });
    })
}


const loadEvents = () => {
    console.log(`-> 이벤트를 로드합니다......`);
    return new Promise((resolve, reject) => {
        const files = fs.readdirSync(`${__dirname}/events/`).filter(file => file.endsWith('.js'));

        console.log(`+--------------------------------+`);
        for (const file of files) {
            try {
                const event = require(`${__dirname}/events/${file}`);
                console.log(`| Loaded event ${file.split('.')[0].padEnd(17, ' ')} |`);

                client.on(file.split('.')[0], event.bind(null, client));
                delete require.cache[require.resolve(`${__dirname}/events/${file}`)];
            } catch (error) {
                reject(error);
            }
        };
        console.log(`+--------------------------------+`);
        console.log(`${color.grey}-- 이벤트 로드가 완료되었습니다. --${color.white}`);

        resolve();
    })
}


const loadCommands = () => {
    console.log(`-> 명령어를 로드하는 중입니다......`);
    return new Promise((resolve, reject) => {
        const files = fs.readdirSync(`${__dirname}/commands/`).filter(file => file.endsWith('.js'));

        console.log(`+---------------------------+`);
        for (const file of files) {
            try {
                const command = require(`${__dirname}/commands/${file}`);

                console.log(`ㅣ${command.name.toLowerCase().padEnd(10, ' ')}의 명령어가 로드됨.ㅣ`);

                client.commands.set(command.name.toLowerCase(), command);
                delete require.cache[require.resolve(`${__dirname}/commands/${file}`)];
            } catch (error) {
                reject(error);
            }
        };
        console.log(`+---------------------------+`);
        console.log(`${color.grey}-- 명령어 로드가 완료되었습니다. --${color.white}`);

        resolve();
    })
}


Promise.resolve()
    .then(() => setEnvironment())
    .then(() => loadFramework())
    .then(() => loadEvents())
    .then(() => loadCommands())
    .then(() => {
        console.log(`${color.green}*** 모두 로드되었습니다. ***${color.white}`);
        client.login(ENV.TOKEN);
    });




const settings = (queue, song) =>
    `**음량:** \`${queue.node.volume}%\`ㅣ**반복:** \`${queue.repeatMode ? (queue.repeatMode === 2 ? 'All' : 'ONE') : 'Off'}\``;


player.events.on('playerStart', (queue, track) => {
    if (queue.repeatMode !== 0) return;
    queue.metadata.channel.send({ embeds: [embed.Embed_play("재생중", track.title, track.url, track.duration, track.thumbnail, settings(queue))] });
});

player.events.on('audioTrackAdd', (queue, track) => {
    if (queue.isPlaying())
        queue.metadata.channel.send({ embeds: [embed.Embed_play("추가됨", track.title, track.url, track.duration, track.thumbnail, settings(queue))] });
});

player.events.on('playerError', (queue, error) => {
    console.log(`연결하는 데 문제가 있습니다. => ${error.message}`);
});

player.events.on('error', (queue, error) => {
    console.log(`노래 대기열에 문제가 있습니다. => ${error.message}`);
});

player.events.on('emptyChannel', (queue) => {
    if (!client.config.autoLeave)
        queue.node.stop();
});