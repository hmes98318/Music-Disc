import type { Client } from "discord.js";
import type { IncomingDiscordPayload } from "lavashark/typings/src/@types";
import type { Bot } from "../../@types";


export default async (_bot: Bot, client: Client, packet: unknown) => {
    client.lavashark.handleVoiceUpdate(packet as IncomingDiscordPayload);
};