const { Client, Intents, Collection } = require('discord.js');
const { Player } = require('discord-player');
const fs = require('fs');
require('dotenv').config();

const embed = require('./embeds/embeds.js');




let client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES
    ],
    disableMentions: 'everyone',
});


client.config = require('./config.json');
client.commands = new Collection();
client.player = new Player(client, {
    ytdlOptions: {
        quality: 'highestaudio',
        highWaterMark: 1 << 25
    }
});

client.login(process.env.TOKEN);

const player = client.player;


const events = fs.readdirSync('./events/').filter(file => file.endsWith('.js'));
for (const file of events) {
    const event = require(`./events/${file}`);
    console.log(`-> Loaded event ${file.split('.')[0]}`);
    client.on(file.split('.')[0], event.bind(null, client));
    delete require.cache[require.resolve(`./events/${file}`)];
};


console.log(`-> Loaded commands ----------`);

fs.readdir('./commands/', (err, files) => {
    if (err)
        return console.log('Could not find any commands!');

    const jsFiles = files.filter(file => file.endsWith('.js'));

    if (jsFiles.length <= 0)
        return console.log('Could not find any commands!');

    for (const file of jsFiles) {
        const command = require(`./commands/${file}`);
        console.log(`Loaded Command ${command.name.toLowerCase()}`);

        client.commands.set(command.name.toLowerCase(), command);
        delete require.cache[require.resolve(`./commands/${file}`)];
    };
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
