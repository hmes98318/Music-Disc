import { connected, dashboard, disconnect } from './dashboard.embed.js';
import { blacklist, filterMsg, help, textMsg, textErrorMsg, textSuccessMsg, textWarningMsg } from './msg.embed.js';
import { ping } from './ping.embed.js';
import { addTrack, addPlaylist, queue } from './queue.embed.js';
import { removeList, removeTrack } from './remove.embed.js';
import { save } from './save.embed.js';
import { server } from './server.embed.js';
import { botStatus, maintainNotice, nodeDisconnected, nodesStatus, nodeStatus, validNodeName } from './status.embed.js';


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
    textMsg,
    textErrorMsg,
    textSuccessMsg,
    textWarningMsg,
    validNodeName,
};

export { embeds };