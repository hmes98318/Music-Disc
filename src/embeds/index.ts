import { status } from "./status";
import { queue } from "./queue";
import { removeList, removeTrack } from "./remove";
import { help } from "./help";
import { server } from "./server";
import { save } from "./save";
import { connected, disconnect, dashboard } from "./dashboard";


const embeds = {
    status,
    queue,
    removeList,
    removeTrack,
    help,
    server,
    save,
    connected,
    disconnect,
    dashboard
}

export { embeds };