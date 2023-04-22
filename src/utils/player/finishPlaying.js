const embed = require(`${__dirname}/../../embeds/embeds`);


const finishPlaying = async (queue) => {
    try {
        await queue.dashboard.edit({ embeds: [embed.Embed_disconnect()], components: [] });
    } catch (error) {
        console.log('Dashboard error:', error);
    }
};

module.exports.finishPlaying = finishPlaying;