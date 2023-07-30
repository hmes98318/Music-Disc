import { ChatInputCommandInteraction, Client, Message } from "discord.js";
import { embeds } from "../embeds";


export const name = 'nodestatus';
export const aliases = ['node', 'nodes', 'nodesstatus'];
export const description = 'Show nodes connection status';
export const usage = 'nodestatus';
export const voiceChannel = false;
export const showHelp = true;
export const sendTyping = true;
export const options = [];


export const execute = async (client: Client, message: Message) => {
    const nodes = client.lavashark.nodes;
    const pingList = await client.lavashark.nodesPing();
    const nodesStatus = [];
    let healthValue = 0;

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const ping = pingList[i];

        if (ping === -1) {
            healthValue++;
            nodesStatus.push({ name: `❌ ${node.identifier}`, value: '**DISCONNECTED**' });
        }
        else {
            nodesStatus.push({ name: `✅ ${node.identifier}`, value: `ping: **${ping}ms**` });
        }
    }
    console.log('nodesStatus', nodesStatus);

    const nodeHealth = healthValue === 0 ? 'All nodes are active' : `⚠️ There are ${healthValue} nodes disconnected`;

    return message.reply({
        embeds: [embeds.nodesStatus(client.config.embedsColor, nodeHealth, nodesStatus)],
        allowedMentions: { repliedUser: false }
    });
}

export const slashExecute = async (client: Client, interaction: ChatInputCommandInteraction) => {
    const nodes = client.lavashark.nodes;
    const pingList = await client.lavashark.nodesPing();
    const nodesStatus = [];
    let healthValue = 0;

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const ping = pingList[i];

        if (ping === -1) {
            nodesStatus.push({ name: `❌ ${node.identifier}`, value: 'DISCONNECTED' });
            healthValue++;
        }
        else {
            nodesStatus.push({ name: `✅ ${node.identifier}`, value: `ping: ${ping}ms` });
        }
    }
    console.log('nodesStatus', nodesStatus);

    const nodeHealth = healthValue === 0 ? '✅ All nodes are active' : `⚠️ There are ${healthValue} nodes disconnected`;

    return interaction.editReply({
        embeds: [embeds.nodesStatus(client.config.embedsColor, nodeHealth, nodesStatus)],
        allowedMentions: { repliedUser: false }
    });
}