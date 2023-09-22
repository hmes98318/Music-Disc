import { ChatInputCommandInteraction, Client, Message } from "discord.js";
import { NodeState } from "lavashark";
import { embeds } from "../embeds";


export const name = 'nodestatus';
export const aliases = ['node', 'nodes', 'nodesstatus'];
export const description = 'Show nodes active status';
export const usage = 'node [node name]';
export const voiceChannel = false;
export const showHelp = true;
export const sendTyping = true;
export const requireAdmin = false;
export const options = [
    {
        name: "nodename",
        description: "The node name",
        type: 3,
        required: false
    }
];


export const execute = async (client: Client, message: Message, args: string[]) => {
    const nodes = client.lavashark.nodes;

    if (!args[0]) { // +node 
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
    else { // +node [node name]
        const nodeName = args.join(' ');

        for (const node of nodes) {
            if (node.identifier === nodeName) {
                if (node.state !== NodeState.CONNECTED) {
                    return message.reply({
                        embeds: [embeds.nodeDisconnected(client.config.embedsColor, nodeName)],
                        allowedMentions: { repliedUser: false }
                    });
                }

                const nodeInfoPromise = node.getInfo();
                const nodeStatsPromise = node.getStats();
                const nodePingPromise = client.lavashark.nodePing(node);
                const [nodeInfo, nodeStats, nodePing] = await Promise.all([nodeInfoPromise, nodeStatsPromise, nodePingPromise]);

                console.log('nodeInfo:', nodeInfo);
                console.log('nodeStats:', nodeStats);
                console.log('nodePing:', nodePing, 'ms');

                return message.reply({
                    embeds: [embeds.nodeStatus(client.config.embedsColor, nodeName, nodeInfo, nodeStats, nodePing)],
                    allowedMentions: { repliedUser: false }
                });
            }
        }

        let nodesName = '';
        for (const node of nodes) {
            nodesName += `\`${node.identifier}\`\n`;
        }

        return message.reply({
            embeds: [embeds.validNodeName(client.config.embedsColor, nodesName)],
            allowedMentions: { repliedUser: false }
        });
    }
}

export const slashExecute = async (client: Client, interaction: ChatInputCommandInteraction) => {
    const nodeName = interaction.options.getString('nodename');
    const nodes = client.lavashark.nodes;

    if (nodeName === null) { // /nodestatus
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
    else { // /nodestatus [node name]
        for (const node of nodes) {
            if (node.identifier === nodeName) {
                if (node.state !== NodeState.CONNECTED) {
                    return interaction.editReply({
                        embeds: [embeds.nodeDisconnected(client.config.embedsColor, nodeName)],
                        allowedMentions: { repliedUser: false }
                    });
                }

                const nodeInfoPromise = node.getInfo();
                const nodeStatsPromise = node.getStats();
                const nodePingPromise = client.lavashark.nodePing(node);
                const [nodeInfo, nodeStats, nodePing] = await Promise.all([nodeInfoPromise, nodeStatsPromise, nodePingPromise]);

                console.log('nodeInfo:', nodeInfo);
                console.log('nodeStats:', nodeStats);
                console.log('nodePing:', nodePing, 'ms');

                return interaction.editReply({
                    embeds: [embeds.nodeStatus(client.config.embedsColor, nodeName, nodeInfo, nodeStats, nodePing)],
                    allowedMentions: { repliedUser: false }
                });
            }
        }

        let nodesName = '';
        for (const node of nodes) {
            nodesName += `\`${node.identifier}\`\n`;
        }

        return interaction.editReply({
            embeds: [embeds.validNodeName(client.config.embedsColor, nodesName)],
            allowedMentions: { repliedUser: false }
        });
    }
}