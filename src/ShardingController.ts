import path from 'path';
import { fileURLToPath } from 'url';

import { ShardingManager } from 'discord.js';
import * as dotenv from 'dotenv';


export class ShardingController {
    public readonly shardFilePath: string;
    public manager: ShardingManager;

    constructor() {
        dotenv.config();

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const fileExtension = path.extname(__filename);
        this.shardFilePath = path.join(__dirname, `./App${fileExtension}`);

        this.manager = new ShardingManager(this.shardFilePath, { token: process.env.BOT_TOKEN });
    }


    public spwan() {
        this.manager.spawn();
    }
}