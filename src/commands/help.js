const embed = require('../embeds/embeds');


module.exports = {
    name: 'help',
    aliases: ['h'],
    showHelp: false,
    description: 'Get some command help',
    options: [],

    execute(client, message, args) {

        let title = client.user.username;
        let thumbnail = client.user.displayAvatarURL();
        const commands = client.commands.filter(x => x.showHelp !== false);
        let description = `**Available Commands**\n` + commands.map(x => `\`${x.name}${x.aliases[0] ? ` (${x.aliases.map(y => y).join(', ')})\`` : '\`'}`).join(' | ');

        return message.reply({ embeds: [embed.Embed_help(title, thumbnail, description)], allowedMentions: { repliedUser: false } });
    },

    slashExecute(client, interaction) {

        let title = client.user.username;
        let thumbnail = client.user.displayAvatarURL();
        const commands = client.commands.filter(x => x.showHelp !== false);
        let description = `**Available Commands**\n` + commands.map(x => `\`${x.name}${x.aliases[0] ? ` (${x.aliases.map(y => y).join(', ')})\`` : '\`'}`).join(' | ');

        return interaction.reply({ embeds: [embed.Embed_help(title, thumbnail, description)], allowedMentions: { repliedUser: false } });
    },
};
