/**
 * Required
 * <script src="/static/js/lib/socket.io-4.7.2.min.js"></script>
 * 
 * <script src="/static/js/utils/formatBytes.js"></script>
 * <script src="/static/js/utils/msToTime.js"></script>
 * <script src="/static/js/utils/timestampToTime.js"></script>
 */


document.addEventListener("DOMContentLoaded", async () => {
    const statusRefreshInterval = 1000;     // 'api_bot_status' 刷新時間 1s


    // Get bot info
    try {
        const data = await (await fetch('/api/info')).json();

        document.getElementById("info_startupTime").textContent = timestampToTime(data.startupTime);
        document.getElementById("info_os_version").textContent = data.os_version;
        document.getElementById("info_bot_version").textContent = data.bot_version;
        document.getElementById("info_node_version").textContent = data.node_version;
        document.getElementById("info_dc_version").textContent = data.dc_version;
        document.getElementById("info_shark_version").textContent = data.shark_version;
        document.getElementById("info_cpu").textContent = data.cpu;
    } catch (error) {
        console.error("Error fetching bot info:", error);
    }


    // Initialize WebSocket connection
    const socket = io();

    // Get bot status
    // console.log('[emit] bot_status');
    socket.emit("bot_status");

    socket.on('api_bot_status', (data) => {
        document.getElementById("stat_server").textContent = data.serverCount;
        document.getElementById("stat_playing").textContent = data.playing;
        document.getElementById("status_uptime").textContent = data.uptime;
        document.getElementById("status_load_percent").textContent = data.load.percent;
        document.getElementById("status_load_detail").textContent = data.load.detail;
        document.getElementById("status_memory_percent").textContent = data.memory.percent;
        document.getElementById("status_memory_detail").textContent = data.memory.detail;
        document.getElementById("status_heap_percent").textContent = data.heap.percent;
        document.getElementById("status_heap_detail").textContent = data.heap.detail;
        document.getElementById("status_ping_api").textContent = data.ping.api + 'ms';
    });


    /**
     * bot_status 刷新計時器
     */
    // ------------------------------------------------- //

    setInterval(() => {
        // console.log('[emit] bot_status');
        socket.emit("bot_status");
    }, statusRefreshInterval);

    // ------------------------------------------------- //
});
