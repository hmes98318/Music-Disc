const { Player } = require('discord-player');
const { Client, Intents, Collection } = require('discord.js');
const fs = require('fs');


let client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES
    ],
    disableMentions: 'everyone',
});


client.config = require('./config');
client.player = new Player(client, client.config.opt.discordPlayer);
client.commands = new Collection();
const player = client.player


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
