import { connected, dashboard, disconnect } from "./dashboard";
import { help } from "./help";
import { ping } from "./ping";
import { queue } from "./queue";
import { removeList, removeTrack } from "./remove";
import { save } from "./save";
import { server } from "./server";
import { status } from "./status";


const embeds = {
    connected,
    dashboard,
    disconnect,
    help,
    ping,
    queue,
    removeList,
    removeTrack,
    save,
    server,
    status,
};

export { embeds };