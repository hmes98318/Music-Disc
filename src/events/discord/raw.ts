import { Client } from "discord.js";
import { IncomingDiscordPayload } from "lavashark/typings/src/@types";

export default async (client: Client, packet: unknown) => client.lavashark.handleVoiceUpdate(packet as IncomingDiscordPayload);