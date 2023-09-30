import { msToTime } from "./unitConverter";

const uptime = (startupTime: Date) => {
    const currentTime = new Date();
    const uptimeMs = currentTime.getTime() - startupTime.getTime();
    return msToTime(uptimeMs);
};

export { uptime };