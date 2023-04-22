const settings = (queue) =>
    `**Volume**: \`${queue.node.volume}%\` | **Loop**: \`${queue.repeatMode ? (queue.repeatMode === 2 ? 'All' : 'Single') : 'Off'}\``;

module.exports.settings = settings;