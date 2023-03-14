const embed = require('../embeds/embeds');


module.exports = {
    name: 'server',
    aliases: [],
    showHelp: false,
    description: '현재 봇이 활성화된 서버를 표시합니다.',
    usage: 'server',
    options: [],

    execute(client, message) {
        let serverlist = '';
        serverlist = client.guilds.cache
            .map(g => `**서버 ID:** ${g.id}\n **서버 이름:** ${g.name}\n **사용자 수:** ${g.memberCount}`)
            .join('\n\n');

        return message.reply({ embeds: [embed.Embed_server(serverlist)], allowedMentions: { repliedUser: false } });
    },

    slashExecute(client, interaction) {
        let serverlist = '';
        serverlist = client.guilds.cache
        .map(g => `**서버 ID:** ${g.id}\n **서버 이름:** ${g.name}\n **사용자 수:** ${g.memberCount}`)
            .join('\n\n');

        return interaction.reply({ embeds: [embed.Embed_server(serverlist)], allowedMentions: { repliedUser: false } });
    },
};