module.exports = async (client) => {
    console.log(`>>> Logged in as ${client.user.username}`);

    client.user.setActivity(client.config.playing);
};