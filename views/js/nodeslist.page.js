/**
 * Required
 * None
 */


document.addEventListener("DOMContentLoaded", async () => {
    const nodesRefreshInterval = 10 * 1000; // 'api_nodes_status' 刷新時間 10s
    const nodeCollapseState = {};           // 節點清單的折疊狀態


    /**
     * Get nodes status
     */
    const getNodesStatus = async () => {
        const data = await (await fetch('/api/node/status')).json();

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
                nodeContainer.addEventListener("click", function () {
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
    };
    await getNodesStatus();


    /**
     * nodes_status 刷新計時器
     */
    // ------------------------------------------------- //

    let nodesTimeLeft = nodesRefreshInterval / 1000;    // 計時器初始時間 (s)
    let countdownElement = document.getElementById("nodes-refresh-timer");

    const nodesRefreshTimer = async () => {
        countdownElement.innerHTML = `<span style="color: #ffffff; opacity: 0.3;"> refreshing in ${nodesTimeLeft} s </span>`;

        if (nodesTimeLeft === 0) {
            nodesTimeLeft = nodesRefreshInterval / 1000;
            await getNodesStatus();
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