const embed = require('../embeds/embeds');


module.exports = {
    name: 'help',
    aliases: ['h'],
    showHelp: false,
    description: 'Get commands help',
    usage: 'help [command]',
    options: [
        {
            name: "command",
            description: "which command need help",
            type: 3,
            required: false
        }
    ],

    execute(client, message, args) {
        const prefix = client.config.prefix;

        if (!args[0]) {
            let title = client.user.username;
            let thumbnail = client.user.displayAvatarURL();
            const commands = client.commands.filter(x => x.showHelp !== false);

            let description = `**Available Commands**\n` + commands.map(x => `• \`${prefix}${x.name}${x.aliases[0] ? ` (${x.aliases.map(y => y).join(', ')})\`` : '\`'}`).join('\n');

            return message.reply({ embeds: [embed.Embed_help(title, thumbnail, description)], allowedMentions: { repliedUser: false } });
        }
        else {
            let helpCmd = args[0];
            const commands = client.commands.filter(x => x.showHelp !== false);
            //console.log('helpCmd', helpCmd);

            let found = false;
            found = commands.find(x => {
                if (helpCmd === x.name || x.aliases.includes(helpCmd)) {
                    let command = x.name
                    let description = `${x.description}\n\`\`\`${prefix}${x.usage}\`\`\``;

                    message.reply({ embeds: [embed.Embed_help2(command, description)], allowedMentions: { repliedUser: false } });
                    return true;
                }
            });

            if (!Boolean(found)) return message.reply({ content: '❌ | The command not found.', allowedMentions: { repliedUser: false } });
        }
    },

    slashExecute(client, interaction) {
        const prefix = client.config.prefix;
        const command = interaction.options.getString("command");

        if (!command) {
            let title = client.user.username;
            let thumbnail = client.user.displayAvatarURL();
            const commands = client.commands.filter(x => x.showHelp !== false);

            let description = `**Available Commands**\n` + commands.map(x => `• \`${prefix}${x.name}${x.aliases[0] ? ` (${x.aliases.map(y => y).join(', ')})\`` : '\`'}`).join('\n');

            return interaction.reply({ embeds: [embed.Embed_help(title, thumbnail, description)], allowedMentions: { repliedUser: false } });

        }
        else {
            let helpCmd = command;
            const commands = client.commands.filter(x => x.showHelp !== false);
            //console.log('helpCmd', helpCmd);

            let found = false;
            found = commands.find(x => {
                if (helpCmd === x.name || x.aliases.includes(helpCmd)) {
                    let command = x.name
                    let description = `${x.description}\n\`\`\`${prefix}${x.usage}\`\`\``;

                    interaction.reply({ embeds: [embed.Embed_help2(command, description)], allowedMentions: { repliedUser: false } });
                    return true;
                }
            });

            if (!Boolean(found)) return interaction.reply({ content: '❌ | The command not found.', allowedMentions: { repliedUser: false } });
        }
    },
};
