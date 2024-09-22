/**
 * Shard test
 * Over 2500 servers require sharding. (https://github.com/Cog-Creators/Red-DiscordBot/issues/713#issuecomment-294323546)
 * 
 * ENABLE_SITE = false
 * ENABLE_LOCAL_NODE = false
 */
import path from 'path';

import { ShardingManager } from 'discord.js';
import * as dotenv from 'dotenv';


dotenv.config();

const fileExtension = path.extname(__filename);
const manager = new ShardingManager(path.resolve(__dirname, `./index${fileExtension}`), { token: process.env.BOT_TOKEN });


manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));

manager.spawn();
