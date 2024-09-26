import os from 'os';

import { version as dcVersion } from 'discord.js';
import { VERSION as sharkVersion } from 'lavashark';

import { getOSVersion } from "./getOSVersion";
import { version as botVersion } from '../../../package.json';


const getSysInfo = async () => {
    return {
        startupTime: new Date(),
        os_version: await getOSVersion(),
        bot_version: `v${botVersion}`,
        node_version: process.version,
        dc_version: `v${dcVersion}`,
        shark_version: `v${sharkVersion}`,
        cpu: `${os.cpus()[0].model}`
    };
};

export { getSysInfo };