'use strict';

const fs = require('fs');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { Player } = require('discord-player');
require('dotenv').config();

const config = require('./config.json');
const embed = require('./src/embeds/embeds');




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


client.config = config;

client.config.prefix = process.env.PREFIX || config.prefix;
client.config.playing = process.env.PLAYING || config.playing;
client.config.quality = process.env.QUALITY || config.quality;
client.config.maxVol = process.env.MAXVOL || config.maxVol;
client.config.autoLeave = process.env.AUTO_LEAVE === 'true' ? true : false || config.autoLeave;
client.config.displayVoiceState = process.env.DISPLAY_VOICE_STATE === 'true' ? true : false || config.displayVoiceState;


client.commands = new Collection();
client.player = new Player(client, {
    ytdlOptions: {
        filter: 'audioonly',
        quality: client.config.quality,
        highWaterMark: 1 << 25
    }
});

client.login(process.env.TOKEN);

const player = client.player;


const events = fs.readdirSync('./src/events/').filter(file => file.endsWith('.js'));
for (const file of events) {
    const event = require(`./src/events/${file}`);
    console.log(`-> Loaded event ${file.split('.')[0]}`);

    client.on(file.split('.')[0], event.bind(null, client));
    delete require.cache[require.resolve(`./src/events/${file}`)];
};


console.log(`-> Loaded commands ......`);

fs.readdir('./src/commands/', (err, files) => {
    console.log(`+-------------------------------+`);
    if (err)
        return console.log('Could not find any commands!');

    const jsFiles = files.filter(file => file.endsWith('.js'));

    if (jsFiles.length <= 0)
        return console.log('Could not find any commands!');

    for (const file of jsFiles) {
        const command = require(`./src/commands/${file}`);

        console.log(`| Loaded Command ${command.name.toLowerCase()}   \t|`);

        client.commands.set(command.name.toLowerCase(), command);
        delete require.cache[require.resolve(`./src/commands/${file}`)];
    };
    console.log(`+-------------------------------+`);
    console.log('-- loading all files finished --');
});




const settings = (queue, song) =>
    `**Volume**: \`${queue.volume}%\` | **Loop**: \`${queue.repeatMode ? (queue.repeatMode === 2 ? 'All' : 'ONE') : 'Off'}\``;


player.on('error', (queue, error) => {
    console.log(`There was a problem with the song queue => ${error.message}`);
});

player.on('connectionError', (queue, error) => {
    console.log(`I'm having trouble connecting => ${error.message}`);
});

player.on('trackStart', (queue, track) => {
    if (queue.repeatMode !== 0)
        return;
    queue.metadata.send({ embeds: [embed.Embed_play("Playing", track.title, track.url, track.duration, track.thumbnail, settings(queue))] });
});

player.on('trackAdd', (queue, track) => {
    if (queue.previousTracks.length > 0)
        queue.metadata.send({ embeds: [embed.Embed_play("Added", track.title, track.url, track.duration, track.thumbnail, settings(queue))] });
});

player.on('channelEmpty', (queue) => {
    if (!client.config.autoLeave)
        queue.stop();
});