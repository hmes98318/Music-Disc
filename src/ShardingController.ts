import path from 'path';
import { ShardingManager } from 'discord.js';
import * as dotenv from 'dotenv';


export class ShardingController {
    public readonly shardFilePath: string;
    public manager: ShardingManager;

    constructor() {
        dotenv.config();

        const fileExtension = path.extname(__filename);
        this.shardFilePath = path.join(__dirname, `./App${fileExtension}`);

        this.manager = new ShardingManager(this.shardFilePath, { token: process.env.BOT_TOKEN });
    }


    public spwan() {
        this.manager.spawn();
    }
}