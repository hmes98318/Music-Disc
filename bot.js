const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const ytpl = require('ytpl');
const auth = require('./auth.json');


const bot = new Discord.Client();
const queue = new Map()


const prefix = '+';

const options = {
    gl: 'TW',
    hl: 'TW',
    limit: 1,
}




bot.on('ready', (message) => {
    console.log(`Logged in as ${bot.user.tag}!`);
    bot.user.setPresence({ activity: { name: `${prefix}help` }, status: 'online' });
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
        loop: false
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
                    return message.channel.send('error')

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

                message.channel.send(Embed_list('Play List', playlist.title, playlist.url, message.author.username, message.author.avatarURL(), playlist.url))

                if (!serverQueue) {
                    queue.set(message.guild.id, constructor);

                    for (var i = 0; i < playlist.items.length; ++i) {
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
                    return
                }
                else {

                    for (var i = 0; i < playlist.items.length; ++i) {
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
                    return
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
            }
            else {
                return message.channel.send('type error')
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
        var { url } = JSON.parse(data)
        console.log(url)
        return url
    }

    function play(guild, music) {
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

            /*
            if (serverQueue.loop)
                serverQueue.loop = false;
            serverQueue.channel_voice.leave();
            queue.delete(guild.id);
            */
            return;
        }, 5000);//防止 ytdl 卡住, loop 時較容易發生

        const dispatcher = serverQueue.connection
            .play(
                ytdl(music.url, {
                    filter: 'audioonly',
                    //bitrate: 192000,  // 192kbps 
                    quality: 'lowestaudio',
                    highWaterMark: 1024 * 1024 * 50
                }))
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
                console.log(new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),'--finish');
                if (!serverQueue.loop)
                    serverQueue.music.shift();
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
        if (serverQueue.loop)
            return message.channel.send('music is looping, need to turn off loop');

        serverQueue.connection.dispatcher.end();
        return message.react('👍')
    }

    function Loop(message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send('join channel,first');
        if (!serverQueue)
            return message.channel.send('nothing can loop');

        if (!serverQueue.loop) {
            serverQueue.loop = true;
            message.react('⭕')
            console.log('loop : ' + serverQueue.loop)
        }
        else {
            serverQueue.loop = false;
            message.react('❌')
            console.log('loop : ' + serverQueue.loop)
        }
    }

    function Leave(message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send('join channel,first');
        if (!serverQueue)
            return message.channel.send('nothing can leave');

        serverQueue.music = [];
        serverQueue.loop = false;
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
        let queueMsg = `Now Playing : ${nowPlaying.title}`

        if (serverQueue.music[1]) {
            if (serverQueue.music.length > 10) {
                queueMsg += `\n---------------\n`;
                for (var i = 1; i <= 10; i++) {

                    queueMsg += `${i}. ${serverQueue.music[i].title}\n`
                    console.log(`${i}. ${serverQueue.music[i].title}\n`)
                }
            }
            else {
                queueMsg += `\n---------------\n`;
                for (var i = 1; i < serverQueue.music.length; i++) {

                    queueMsg += `${i}. ${serverQueue.music[i].title}\n`
                    console.log(`${i}. ${serverQueue.music[i].title}\n`)
                }
            }


            console.log('++++++++++++++++++++++++++++++++++++')
            console.log(serverQueue.music)
            console.log('++++++++++++++++++++++++++++++++++++')



        }
        message.react('👍')
        return message.channel.send(Embed_queue('Queue', queueMsg))
    }

})



function Embed_play(status, music_title, music_url) {
    const Embed_play = new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .addField(status, `[${music_title}](${music_url})`, true)
        .setTimestamp()
    return Embed_play
}

function Embed_queue(status, queueMsg) {
    const Embed_queue = new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .addField(status, queueMsg)
        .setTimestamp()
    return Embed_queue
}

function Embed_help(prefix) {
    const Embed_help = new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .addField('播放音樂', `${prefix}p 網址`, false)
        .addField('跳過音樂', `${prefix}skip`, false)
        .addField('循環音樂', `${prefix}loop`, false)
        .addField('查看列隊', `${prefix}queue`, false)
        .addField('暫停音樂', `${prefix}pause`, false)
        .addField('恢復播放', `${prefix}resume`, false)
        .addField('離開頻道', `${prefix}leave`, false)
        .addField('系統狀態', `${prefix}status`, false)
        .setTimestamp()
    return Embed_help
}

function Embed_list(status, list_title, list_url, user, header, url) {
    const Embed_list = new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .setAuthor(user, header, url)
        .addField(status, `[${list_title}](${list_url})`, true)
        .setTimestamp()
    return Embed_list
}
