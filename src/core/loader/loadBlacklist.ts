import * as fs from 'fs';
import type { Bot } from '../../@types';


const loadBlacklist = async (bot: Bot) => {
    try {
        const jsonString = fs.readFileSync(`blacklist.json`, 'utf-8');
        const blacklistArray = JSON.parse(jsonString);

        if (Array.isArray(blacklistArray) && blacklistArray.length > 0) {
            bot.blacklist = blacklistArray;
            bot.logger.emit('log', 'Blacklist loaded: ' + bot.blacklist.length + ' users');
        }
        else {
            bot.logger.emit('log', 'No blacklist entries found.');
        }
    } catch (error) {
        bot.logger.emit('error', 'Error loading blacklist:' + error);
    }
};

export { loadBlacklist };