import { connected, dashboard, disconnect } from "./dashboard.embed";
import { blacklist, filterMsg, help } from "./msg.embed";
import { ping } from "./ping.embed";
import { addTrack, addPlaylist, queue } from "./queue.embed";
import { removeList, removeTrack } from "./remove.embed";
import { save } from "./save.embed";
import { server } from "./server.embed";
import { botStatus, maintainNotice, nodeDisconnected, nodesStatus, nodeStatus, validNodeName } from "./status.embed";


const embeds = {
    addTrack,
    addPlaylist,
    botStatus,
    blacklist,
    connected,
    dashboard,
    disconnect,
    filterMsg,
    help,
    maintainNotice,
    nodeDisconnected,
    nodesStatus,
    nodeStatus,
    ping,
    queue,
    removeList,
    removeTrack,
    save,
    server,
    validNodeName,
};

export { embeds };