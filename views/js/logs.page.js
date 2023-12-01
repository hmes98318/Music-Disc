/**
 * Required
 * <script src="/static/js/lib/socket.io-4.7.2.min.js"></script>
 * 
 * <script src="/static/js/utils/convertAnsiToHtml.js"></script>
 */


document.addEventListener("DOMContentLoaded", async () => {
    const updateRefreshInterval = 1000;     // 'api_logger_update' 刷新時間 1s
    let currentLogsLength = 0;              // 本地載入的 log 長度

    const logsContainer = document.getElementById('logs-container');


    /**
     * Scroll the scroll bar to the bottom
     */
    const scrollToBottom = () => {
        logsContainer.scrollTop = logsContainer.scrollHeight;
    };

    const updateLogContainer = (logs) => {
        logsContainer.innerHTML += '<br>';
        logsContainer.innerHTML += convertAnsiToHtml(logs.join('<br>')).replaceAll('<span style="color: white;">', '</span>');
        scrollToBottom();
    };


    // Get logs
    try {
        const response = await fetch('/api/logger/getLogs');
        const { logs } = await response.json();

        currentLogsLength = logs.length;
        updateLogContainer(logs);
    } catch (error) {
        console.error("Error fetching local node logs:", error);
    }


    const socket = io();
    socket.emit("logger_update", currentLogsLength);

    // localnode log 刷新
    socket.on('api_logger_update', (newLogs) => {
        // console.log('newLogs', newLogs);
        if (newLogs === 'SAME_LENGTH') {
            return;
        }

        currentLogsLength += newLogs.length;
        updateLogContainer(newLogs);
    });


    /**
     * logger_update 刷新計時器
     */
    // ------------------------------------------------- //

    setInterval(() => {
        // console.log('[emit] logger_update', 'currentLogsLength', currentLogsLength);
        socket.emit("logger_update", currentLogsLength);
    }, updateRefreshInterval);

    // ------------------------------------------------- //
});
