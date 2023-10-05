import { Client } from "discord.js";

export default async (_client: Client, message: string) => {
    console.error(`[LavaShark]`, message);
};