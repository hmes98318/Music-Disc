/**
 * Required
 * <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
 * <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
 * 
 * <script src="/static/js/utils/formatBytes.js"></script>
 * <script src="/static/js/utils/msToTime.js"></script>
 * <script src="/static/js/utils/timestampToTime.js"></script>
 */


$(function () {
    const statusRefreshInterval = 1000;     // 'api_bot_status' 刷新時間 5s
    const nodesRefreshInterval = 10000;     // 'api_nodes_status' 刷新時間 10s

    const nodeCollapseState = {};           // 節點清單的折疊狀態


    // Get bot info
    $.get('/api/info', (data) => {
        document.getElementById("info_startupTime").textContent = timestampToTime(data.startupTime);
        document.getElementById("info_os_version").textContent = data.os_version;
        document.getElementById("info_bot_version").textContent = data.bot_version;
        document.getElementById("info_node_version").textContent = data.node_version;
        document.getElementById("info_dc_version").textContent = data.dc_version;
        document.getElementById("info_shark_version").textContent = data.shark_version;
        document.getElementById("info_cpu").textContent = data.cpu;
    });


    const socket = io();

    // Get bot status
    // console.log('[emit] bot_status');
    socket.emit("bot_status");

    // Get nodes status
    // console.log('[emit] nodes_status');
    socket.emit("nodes_status");


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

    socket.on('api_nodes_status', (data) => {
        // console.log('api_nodes_status', data);

        const nodesArray = data;
        const nodeStatusList = document.getElementById("nodeStatusList");

        // 清空現有的節點狀態列表
        nodeStatusList.innerHTML = "";

        nodesArray.forEach((node) => {
            const nodeContainer = document.createElement("div");
            nodeContainer.className = "node-container";
            nodeContainer.textContent = `${node.id} [${node.state === 1 ? "CONNECTED" : node.state === 2 ? "DISCONNECTED" : "CONNECTING"}] - ${node.ping}ms`;

            // 根據節點狀態設置樣式
            if (node.state === 0) { // CONNECTING
                nodeContainer.style.color = "#1ad1ff";
            }
            else if (node.state === 2) { // DISCONNECTED
                nodeContainer.style.color = "#fa2a2a";
            }
            else if (node.state === 1) { // CONNECTED
                nodeContainer.style.color = "#4AF626";

                const nodeContent = document.createElement("div");
                nodeContent.className = "node-content";
                nodeContent.innerHTML = `
                <div class="node-info-and-stats" style="color: black;">
                    <div class="info">
                        <h3>Info</h3>
                        <p>Version: <strong>${node.info.version.semver}</strong></p>
                        <p>JVM: <strong>${node.info.jvm}</strong></p>
                        <p>Lavaplayer: <strong>${node.info.lavaplayer}</strong></p>
                        <p>Git: <strong>${node.info.git.commit}</strong></p>
                        <p>Build time: <strong>${timestampToTime(node.info.buildTime)}</strong></p>
                    </div>
                    <div class="stats">
                        <h3>Stats</h3>
                        <p>Uptime: <strong>${msToTime(node.stats.uptime)}</strong></p>
                        <p>Player: <strong>${node.stats.players}</strong></p>
                        <p>Playing: <strong>${node.stats.playingPlayers}</strong></p>
                    </div>
                </div>
                <div class="node-cpu-and-memory" style="color: black;">
                    <div class="cpu">
                        <h3>CPU</h3>
                        <p>Cores: <strong>${node.stats.cpu.cores}</strong></p>
                        <p>System Load: <strong>${node.stats.cpu.systemLoad.toFixed(6)}</strong></p>
                        <p>Lavalink Load: <strong>${node.stats.cpu.lavalinkLoad.toFixed(6)}</strong></p>
                    </div>
                    <div class="memory">
                        <h3>Memory</h3>
                        <p>Used: <strong>${formatBytes(node.stats.memory.used)}</strong></p>
                        <p>Free: <strong>${formatBytes(node.stats.memory.free)}</strong></p>
                        <p>Allocated: <strong>${formatBytes(node.stats.memory.allocated)}</strong></p>
                        <p>Reservable: <strong>${formatBytes(node.stats.memory.reservable)}</strong></p>
                    </div>
                </div>
                `;

                // 初始化摺疊狀態
                if (nodeCollapseState[node.id] === undefined) {
                    nodeContent.style.display = "none";
                    nodeCollapseState[node.id] = "none";
                }
                nodeContent.style.display = nodeCollapseState[node.id];

                // 添加摺疊狀態點擊事件
                nodeContainer.addEventListener("click", () => {
                    if (nodeContent.style.display === "none") {
                        nodeContent.style.display = "block";
                        nodeCollapseState[node.id] = "block";
                    }
                    else {
                        nodeContent.style.display = "none";
                        nodeCollapseState[node.id] = "none";
                    }
                });

                // 將節點內容加入節點區塊中
                nodeContainer.appendChild(nodeContent);
            }

            // 將節點區塊添加到列表中
            nodeStatusList.appendChild(nodeContainer);
        });
    });


    /**
     * bot_status 刷新計時器
     */
    setInterval(async () => {
        // console.log('[emit] bot_status');
        socket.emit("bot_status");
    }, statusRefreshInterval);

    /**
     * nodes_status 刷新計時器
     */
    // ------------------------------------------------- //

    let nodesTimeLeft = nodesRefreshInterval / 1000;    // 計時器初始時間 (s)
    let countdownElement = document.getElementById("nodes-refresh-timer");

    const nodesRefreshTimer = () => {
        countdownElement.innerHTML = `<span style="color: #ffffff; opacity: 0.3;"> refreshing in ${nodesTimeLeft} s </span>`;

        if (nodesTimeLeft === 0) {
            nodesTimeLeft = nodesRefreshInterval / 1000;
            socket.emit("nodes_status");
            // console.log('[emit] nodes_status');
        }
        else {
            nodesTimeLeft--;
        }
        setTimeout(nodesRefreshTimer, 1000);
    };
    nodesRefreshTimer();

    // ------------------------------------------------- //
});