import { msToTime } from './unitConverter.js';

const uptime = (startupTime: Date) => {
    const currentTime = new Date();
    const uptimeMs = currentTime.getTime() - startupTime.getTime();
    return msToTime(uptimeMs);
};

export { uptime };