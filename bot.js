const Discord = require('discord.js');
//const ytdl = require('ytdl-core');
const ytdl = require('ytdl-core-discord');
const ytsr = require('ytsr');
const ytpl = require('ytpl');
const { Spotify } = require('spotify-it');
const spotifyToYT = require("spotify-to-yt");
const os = require('os');
const auth = require('./auth.json');


const bot = new Discord.Client();
const queue = new Map()
const uptime = new Date();

const prefix = '+';

const options = {
    gl: 'TW',
    hl: 'TW',
    limit: 1,
}

const spotify = new Spotify({
    id: auth.Client_ID,
    secret: auth.Client_Secret,
    defaultLimit: 30
})



bot.on('ready', (message) => {
    console.log(`Logged in as ${bot.user.tag}!`);
    bot.user.setPresence({ activity: { name: `music | ${prefix}help` }, status: 'online' });
    //record uptime
});
bot.login(auth.token);




bot.on("message", async (message) => {

    let serverQueue = queue.get(message.guild.id);
    let channelVoice = message.member.voice.channel;
    let args;

    const constructor = {
        channel_txt: message.channel,
        channel_voice: channelVoice,
        connection: null,
        music: [],
        volume: 10,
        playing: true,
        loop_one: false,
        loop_all: false
    };


    if (message.content[0] === prefix) {
        console.log(`--- ${message.author.username} : ${message.content}`)
        args = message.content.slice(1).trim().split(/ +/g);
        let command = args.shift().toLowerCase();


        switch (command) {

            case 'join':
                Join(message, serverQueue);
                break;

            case 'p':
                Execute(message, serverQueue);
                break;

            case 'skip':
                Skip(message, serverQueue);
                break;

            case 'loop':
                Loop(message, serverQueue);
                break;

            case 'leave':
                Leave(message, serverQueue);
                break;

            case 'pause':
                Pause(message, serverQueue);
                break;

            case 'resume':
                Resume(message, serverQueue);
                break;

            case 'queue':
                Queue(message, serverQueue);
                break;

            case 'help':
                message.channel.send(Embed_help(prefix));
                break;

            case 'status':
                message.channel.send(Embed_status(Uptime(uptime), os.cpus()[0].model, Usage(), Math.round((os.totalmem() - os.freemem()) / (1000 * 1000)) + 'MB', Date.now() - message.createdTimestamp));
                break;

            case 'server':
                Server();
                break;
        }

    }
    async function Execute(message, serverQueue) {

        let musicInfo;
        let musicURL;
        let music = [];


        if (!channelVoice) {
            return message.channel.send('join channel')
        }
        else { // -------------- use ytsr --------------
            let type = message.content.replace(`${prefix}p`, '').trim();

            if (message.content.indexOf(`http`) > -1 != true) { // youtube search
                console.log('yt search');
                if (!message.content.replace(`${prefix}p`, '').trim())
                    return message.channel.send(Embed_cantFindSong(prefix));

                if (musicURL = String(await search(message.content.replace(`${prefix}p`, '').trim())).match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch|v|embed)(?:\.php)?(?:\?.*v=|\/))([a-zA-Z0-9\_-]+)/)) {

                    musicInfo = await ytdl.getInfo(musicURL);

                    music = {
                        title: musicInfo.videoDetails.title,
                        url: musicInfo.videoDetails.video_url
                    }; console.log(music);
                }
                else
                    return message.channel.send('Not found, try againg');
            }

            else if (type.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
                console.log('yt list');

                let playListUrl = message.content.replace(`${prefix}p`, '').trim();

                console.log(playListUrl);
                playListUrl = playListUrl.split('playlist?list=');
                console.log(`list = ${playListUrl[playListUrl.length - 1]}`);

                let playlist = await ytpl(playListUrl[playListUrl.length - 1]);

                message.channel.send(Embed_list('Youtube Play List', playlist.title, playlist.url, message.author.username, message.author.avatarURL(), playlist.url))

                if (!serverQueue) {
                    queue.set(message.guild.id, constructor);

                    for (var i = 0; i < playlist.items.length; i++) {
                        console.log(`--[${i}]-----------`);
                        console.log(`${playlist.items[i].title}\n${playlist.items[i].shortUrl}`);

                        music = {
                            title: playlist.items[i].title,
                            url: playlist.items[i].shortUrl
                        }; console.log(music);

                        constructor.music.push(music);
                    }
                    console.log('-----List Done------');

                    console.log('////////////////////////////////////')
                    console.log(constructor.music)
                    console.log('////////////////////////////////////')

                    try {
                        let connection = await channelVoice.join();
                        constructor.connection = connection;
                        play(message.guild, constructor.music[0])
                    }
                    catch (err) {
                        console.log(err);
                        queue.delete(message.guild.id);
                        return message.channel.send('error')
                    }
                    return;
                }

                else {

                    for (var i = 0; i < playlist.items.length; i++) {
                        console.log(`--[${i}]-----------`);
                        console.log(`${playlist.items[i].title}\n${playlist.items[i].shortUrl}`);

                        music = {
                            title: playlist.items[i].title,
                            url: playlist.items[i].shortUrl
                        }; console.log(music);

                        serverQueue.music.push(music);
                    }
                    console.log('-----List Done------');

                    console.log('++++++++++++++++++++++++++++++++++++');
                    console.log(serverQueue.music);
                    console.log('++++++++++++++++++++++++++++++++++++');
                    return;
                }
            }

            else if (args[args.length - 1].match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch|v|embed)(?:\.php)?(?:\?.*v=|\/))([a-zA-Z0-9\_-]+)/)) {
                console.log('yt link');
                //musicURL = message.content.replace(`${prefix}p`, '').trim();
                musicURL = args[args.length - 1];
                console.log(musicURL)

                musicInfo = await ytdl.getInfo(musicURL);

                music = {
                    title: musicInfo.videoDetails.title,
                    url: musicInfo.videoDetails.video_url
                }; console.log(music);
                //constructor.music.push(music);
            }

            else if (type.match(/^https?:\/\/(?:open|play)\.spotify\.com\/playlist\//) && Spotify.validate(message.content.replace(`${prefix}p`, '').trim(), 'PLAYLIST')) {
                console.log('spotify list');

                let playListUrl = message.content.replace(`${prefix}p`, '').trim();
                let playlist = await spotify.getPlaylist(playListUrl);

                message.channel.send(Embed_spotify('Spotify Play List', playlist.name, playListUrl, message.author.username, message.author.avatarURL(), playListUrl))

                if (!serverQueue) {
                    queue.set(message.guild.id, constructor);


                    let i = 0;
                    for (const track of playlist) {
                        console.log(`spotify url[${i++}] : ${track.url}`);
                        let sty = await spotifyToYT.trackGet(track.url);

                        music = {
                            title: sty.info[0].title,
                            url: sty.url
                        }; console.log(music);

                        constructor.music.push(music);
                    }
                    console.log('-----List Done------');

                    console.log('////////////////////////////////////')
                    console.log(constructor.music)
                    console.log('////////////////////////////////////')

                    try {
                        let connection = await channelVoice.join();
                        constructor.connection = connection;
                        play(message.guild, constructor.music[0])
                    }
                    catch (err) {
                        console.log(err);
                        queue.delete(message.guild.id);
                        return message.channel.send('error')
                    }
                    return;
                }

                else {
                    let i = 0;
                    for (const track of playlist) {
                        console.log(`spotify url[${i++}] : ${track.url}`);
                        let sty = await spotifyToYT.trackGet(track.url);

                        music = {
                            title: sty.info[0].title,
                            url: sty.url
                        }; console.log(music);

                        serverQueue.music.push(music);
                    }
                    console.log('-----List Done------');

                    console.log('++++++++++++++++++++++++++++++++++++');
                    console.log(serverQueue.music);
                    console.log('++++++++++++++++++++++++++++++++++++');
                    return;
                }
            }

            else {
                return message.channel.send(Embed_cantFindSong(prefix));
            }





            if (!serverQueue) {

                queue.set(message.guild.id, constructor);

                constructor.music.push(music);
                console.log('////////////////////////////////////');
                console.log(constructor.music);
                console.log('////////////////////////////////////');

                try {
                    let connection = await channelVoice.join();
                    constructor.connection = connection;
                    play(message.guild, constructor.music[0])
                }
                catch (err) {
                    console.log(err);
                    queue.delete(message.guild.id);
                    return message.channel.send('error')
                }
            } else {
                serverQueue.music.push(music);

                console.log('++++++++++++++++++++++++++++++++++++');
                console.log(serverQueue.music);
                console.log('++++++++++++++++++++++++++++++++++++');

                message.react('👍')
                return message.channel.send(Embed_play('Queue', music.title, music.url))//.then(msg => { msg.delete({ timeout: 300000 }) })
            }
        }
    }

    async function search(msg) {
        //youtube搜尋
        var firstResultBatch = await ytsr(msg, options);
        var data = JSON.stringify(firstResultBatch.items[0]);
        var { url } = JSON.parse(data);
        console.log(url);
        return url;
    }

    async function play(guild, music) {
        const serverQueue = queue.get(guild.id);
        if (!music) {
            if (serverQueue.loop)
                serverQueue.loop = false;
            serverQueue.channel_voice.leave();
            queue.delete(guild.id);
            return;
        }

        var timeoutID = setTimeout(() => {
            console.log('*** timeout ***');
            if (!message.member.voice.channel)
                return message.channel.send('join channel,first');

            if (!serverQueue.loop)
                serverQueue.music.shift();

            play(guild, serverQueue.music[0]);
            return;
        }, 5000);//防止 ytdl 卡住, loop 時較容易發生

        const dispatcher = serverQueue.connection
            .play(
                await ytdl(music.url, {
                    filter: 'audioonly',
                    bitrate: 96000,  // 96kbps 
                    //quality: 'lowestaudio',
                    opusEncoded: true,
                    liveBuffer: 20000,
                    dlChunkSize: 0,
                    highWaterMark: 1024 * 1024 * 10 // 10MB
                }), { volume: false, type: 'opus', highWaterMark: 64 /*307ms*/ })
            .on("start", () => {
                console.log(new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }), ' --Now Playing', music.title, music.url)
                clearTimeout(timeoutID);
                message.react('👍')
                if (!serverQueue.loop) {
                    message.channel.send(Embed_play('Now Playing', music.title, music.url)).then(msg => {
                        msg.delete({ timeout: 600000 })
                    })
                }
            })
            .on("finish", () => {
                console.log(new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }), '--finish');
                if (!serverQueue.loop_all && !serverQueue.loop_one)
                    serverQueue.music.shift();

                if (serverQueue.loop_all) {
                    let music2 = [];
                    let music_length = serverQueue.music.length;

                    for (var i = 0; i <music_length; i++) {
                        music2[i] = serverQueue.music[(i+1) % music_length];
                    }
                    serverQueue.music = music2;
                }

                play(guild, serverQueue.music[0]);
            })
    }

    function Join(message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send('join channel,first');
        if (!message.member.voice.channel.join)
            return message.channel.send('music already joined');

        message.member.voice.channel.join()
        return message.react('👍')

    }

    function Skip(message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send('join channel,first');
        if (!serverQueue)
            return message.channel.send('nothing can skip');
        if (!serverQueue.connection || !serverQueue.connection.dispatcher || !serverQueue.connection.dispatcher.end)
            return message.channel.send(`TypeError: Cannot read property 'dispatcher' of null`);
        //if (serverQueue.loop)
        //    return message.channel.send('music is looping, need to turn off loop');

        serverQueue.connection.dispatcher.end();
        return message.react('👍')
    }

    function Loop(message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send('join channel,first');
        if (!serverQueue)
            return message.channel.send('nothing can loop');


        if (message.content.split(" ")[1] === "all") {
            serverQueue.loop_all = true;
            serverQueue.loop_one = false;
            message.react('⭕');
            console.log('loop : ' + serverQueue.loop)
        }
        else if (message.content.split(" ")[1] === "one") {
            serverQueue.loop_all = false;
            serverQueue.loop_one = true;
            message.react('⭕');
            console.log('loop : ' + serverQueue.loop)
        }
        else if (message.content.split(" ")[1] === "off") {
            serverQueue.loop_all = false;
            serverQueue.loop_one = false;
            message.react('❌');
            console.log('loop : ' + serverQueue.loop)
        }
        else {
            return message.channel.send('loop <all/one/off>');
        }
    }

    function Leave(message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send('join channel,first');
        if (!serverQueue)
            return message.channel.send('nothing can leave');

        serverQueue.music = [];
        serverQueue.loop_all = false;
        serverQueue.loop_one = false;
        serverQueue.connection.dispatcher.end();
        return message.react('👍')
    }

    function Pause(message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send('join channel,first');
        if (!serverQueue)
            return message.channel.send('nothing can pause');
        if (!serverQueue.connection.dispatcher.pause)
            return message.channel.send('music already paused');

        serverQueue.connection.dispatcher.pause();
        return message.react('👍')
    }

    function Resume(message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send('join channel,first');
        if (!serverQueue)
            return message.channel.send('nothing can resume');
        if (!serverQueue.connection.dispatcher.resume)
            return message.channel.send('music already resume');

        serverQueue.connection.dispatcher.resume();
        return message.react('👍')
    }

    function Queue(message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send('join channel,first');
        if (!serverQueue)
            return message.channel.send('nothing can queue');

        let nowPlaying = serverQueue.music[0];
        let queueMsg = `Now Playing : ${nowPlaying.title}`;

        if (serverQueue.music[1]) {
            if (serverQueue.music.length > 10) {
                queueMsg += `\n---------------\n`;
                for (var i = 1; i <= 10; i++) {

                    queueMsg += `${i}. ${serverQueue.music[i].title}\n`;
                    console.log(`${i}. ${serverQueue.music[i].title}\n`);
                } queueMsg += `and ${serverQueue.music.length} other songs`;
            }
            else {
                queueMsg += `\n---------------\n`;
                for (var i = 1; i < serverQueue.music.length; i++) {

                    queueMsg += `${i}. ${serverQueue.music[i].title}\n`;
                    console.log(`${i}. ${serverQueue.music[i].title}\n`);
                }
            }
            console.log('++++++++++++++++++++++++++++++++++++');
            console.log(serverQueue.music);
            console.log('++++++++++++++++++++++++++++++++++++');
        }
        message.react('👍')
        return message.channel.send(Embed_queue('Queue', queueMsg));
    }

    function Server() {
        let serverlist = ''
        bot.guilds.cache.forEach((guild) => {
            serverlist = serverlist.concat(" - " + guild.name + ": ID: " + guild.id + "\n")
        })
        return message.channel.send(Embed_server(serverlist));
    }

})



function Embed_play(status, music_title, music_url) {
    const Embed_play = new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .addField(status, `[${music_title}](${music_url})`, true)
        .setTimestamp()
    return Embed_play;
}

function Embed_queue(status, queueMsg) {
    const Embed_queue = new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .addField(status, queueMsg)
        .setTimestamp()
    return Embed_queue;
}

function Embed_list(status, list_title, list_url, user, header, url) {
    const Embed_list = new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .setAuthor(user, header, url)
        .addField(status, `[${list_title}](${list_url})`, true)
        .setTimestamp()
    return Embed_list;
}

function Embed_spotify(status, list_title, list_url, user, header, url) {
    const Embed_spotify = new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .setAuthor(user, header, url)
        .addField(status, `[${list_title}](${list_url})`, true)
        .setTimestamp()
    return Embed_spotify;
}

function Embed_cantFindSong(prefix) {
    const Embed_cantFindSong = new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .addField('播放音樂', `${prefix}p youtube link, spotify play list, or type name to search`, false)
        .setTimestamp()
    return Embed_cantFindSong;
}

function Embed_help(prefix) {
    const Embed_help = new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .addField('播放音樂', `${prefix}p url or name`, false)
        .addField('跳過音樂', `${prefix}skip`, false)
        .addField('循環音樂', `${prefix}loop`, false)
        .addField('查看列隊', `${prefix}queue`, false)
        .addField('暫停音樂', `${prefix}pause`, false)
        .addField('恢復播放', `${prefix}resume`, false)
        .addField('離開頻道', `${prefix}leave`, false)
        .addField('系統狀態', `${prefix}status`, false)
        .setTimestamp()
    return Embed_help;
}

function Embed_status(uptime, cpu, cpu_usage, ram, ping) {
    const Embed_status = new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .setTitle('Music Bot')
        .addField(`📊 USAGE`, `CPU : **${cpu_usage}**\nMEM : **${ram}**\nUptime : **${uptime}**\nPING : **${ping}ms**\n━━━━━━━━━━━━━━━━━━━━━━`, false)
        .setTimestamp()
    return Embed_status;
}

function Embed_server(serverlist) {
    const Embed_server = new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .setTitle("Servers that have Bot", '')
        .setDescription(serverlist)
    return Embed_server;
}








function Uptime(uptime) {

    let Today = new Date();
    let date1 = uptime.getTime();
    let date2 = Today.getTime();
    let total = (date2 - date1) / 1000;

    let day = parseInt(total / (24 * 60 * 60));//計算整數天數
    let afterDay = total - day * 24 * 60 * 60;//取得算出天數後剩餘的秒數
    let hour = parseInt(afterDay / (60 * 60));//計算整數小時數
    let afterHour = total - day * 24 * 60 * 60 - hour * 60 * 60;//取得算出小时数后剩余的秒数
    let min = parseInt(afterHour / 60);//计算整数分
    let afterMin = Math.round(total - day * 24 * 60 * 60 - hour * 60 * 60 - min * 60);//取得算出分后剩余的秒数
    console.log(day + ' / ' + hour + ':' + min + ':' + afterMin);

    return /*day + ' Days' +*/ hour + 'Hour(s) ' + min + 'Minute(s)' /*+ afterMin*/;
}

function Usage() {
    console.log(os.loadavg())
    let avg_load = os.loadavg();
    return avg_load[0] + '%';
}
