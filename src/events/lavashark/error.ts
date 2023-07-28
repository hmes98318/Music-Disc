import { Client } from "discord.js";
import { Node } from "lavashark";


export default async (_client:Client, node: Node, error: any) => {
    console.error(`[LavaShark] Error on node "${node.identifier}":`, error.message);
};