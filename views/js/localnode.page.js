/**
 * Required
 * <script src="/static/js/lib/socket.io-4.7.2.min.js"></script>
 * <script src="/static/js/lib/prism-1.29.0-min.js"></script>
 * 
 * <script src="/static/js/utils/sendControlRequest.js"></script>
 * <script src="/static/js/utils/convertAnsiToHtml.js"></script>
 */


document.addEventListener("DOMContentLoaded", async () => {
    // 檢查是否啟用 localnode
    const response = await fetch('/api/localnode/hasEnable')
        .catch((error) => {
            console.error('Error checking local node status:', error);
            return;
        });
    const { enable } = await response.json();

    if (!enable) {
        const contentContainer = document.getElementById('content');
        contentContainer.innerHTML = "<h2>Local Node is not enabled</h2>";
        return;
    }

    // ------------------------------------------------- //


    const updateRefreshInterval = 1000;     // 'api_localnode_active', 'api_localnode_update' 刷新時間 1s
    let currentLogsLength = 0;              // 本地載入的 log 長度

    const localnodeStatusContainer = document.getElementById('localnode-status');
    const logsContainer = document.getElementById('logs-container');


    /**
     * Scroll the scroll bar to the bottom
     */
    const scrollToBottom = () => {
        logsContainer.scrollTop = logsContainer.scrollHeight;
    };

    const updateLogContainer = (logs) => {
        logsContainer.innerHTML += '<br>';
        logsContainer.innerHTML += convertAnsiToHtml(logs.join('<br>'));
        scrollToBottom();
    };


    // Get logs
    try {
        const response = await fetch('/api/localnode/getLogs');
        const { logs } = await response.json();

        currentLogsLength = logs.length;
        updateLogContainer(logs);
    } catch (error) {
        console.error("Error fetching local node logs:", error);
    }


    const socket = io();

    socket.emit("localnode_active");
    socket.emit("localnode_update", currentLogsLength);


    // localnode 活動狀態
    socket.on('api_localnode_active', (active) => {
        const statusText = active === 'ACTIVE' ? '<div class="active-status">Active</div>' : '<div class="inactive-status">Inactive</div>';
        localnodeStatusContainer.innerHTML = `<p>${statusText}</p>`;
    });


    // localnode log 刷新
    socket.on('api_localnode_update', (newLogs) => {
        // console.log('newLogs', newLogs);
        if (newLogs === 'SAME_LENGTH') {
            return;
        }

        currentLogsLength += newLogs.length;
        updateLogContainer(newLogs);
    });


    /**
     * localnode_active, localnode_update 刷新計時器
     */
    // ------------------------------------------------- //

    setInterval(() => {
        // console.log('[emit] localnode_active');
        // console.log('[emit] localnode_update', 'currentLogsLength', currentLogsLength);
        socket.emit("localnode_active");
        socket.emit("localnode_update", currentLogsLength);
    }, updateRefreshInterval);

    // ------------------------------------------------- //
});