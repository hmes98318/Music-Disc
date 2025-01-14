import os from 'os';
import fs from 'fs/promises';

import { version as dcVersion } from 'discord.js';
import { VERSION as sharkVersion } from 'lavashark';

import { getOSVersion } from './getOSVersion.js';


const DEFAULT_BOT_VERSION = '0.0.0';

const getBotVersion = async () => {
    try {
        const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf-8'));
        return packageJson.version || DEFAULT_BOT_VERSION;
    } catch (error) {
        console.error('Failed to read package.json or retrieve version:', JSON.stringify(error));
        return DEFAULT_BOT_VERSION;
    }
};

const getSysInfo = async () => {
    return {
        startupTime: new Date(),
        os_version: await getOSVersion(),
        bot_version: `v${await getBotVersion()}`,
        node_version: process.version,
        dc_version: `v${dcVersion}`,
        shark_version: `v${sharkVersion}`,
        cpu: `${os.cpus()[0].model}`
    };
};

export { getSysInfo };