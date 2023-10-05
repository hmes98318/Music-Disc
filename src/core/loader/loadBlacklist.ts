import * as fs from 'fs';
import type { Client } from 'discord.js';


const loadBlacklist = async (client: Client) => {
    try {
        const jsonString = fs.readFileSync(`${__dirname}/../../../blacklist.json`, 'utf-8');
        const blacklistArray = JSON.parse(jsonString);

        if (Array.isArray(blacklistArray) && blacklistArray.length > 0) {
            client.config.blacklist = blacklistArray;
            console.log('Blacklist loaded:', client.config.blacklist.length, 'users');
        }
        else {
            console.log('No blacklist entries found.');
        }
    } catch (error) {
        console.error('Error loading blacklist:', error);
    }
};

export { loadBlacklist };