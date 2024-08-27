/**
 * Required
 * <script src="/static/js/utils/convertAnsiToHtml.js"></script>
 */


const logsContainer = document.getElementById('logs-container');
let currentLogsLength = 0;              // 本地載入的 log 長度


/**
 * Scroll the scroll bar to the bottom
 */
const scrollToBottom = () => {
    logsContainer.scrollTop = logsContainer.scrollHeight;
};

/**
 * Update log container
 */
const updateLogContainer = (logs) => {
    logsContainer.innerHTML += '<br>';
    logsContainer.innerHTML += convertAnsiToHtml(logs.join('<br>')).replaceAll('<span style="color: white;">', '</span>');
    scrollToBottom();
};

/**
 * Get bot logs
 */
const getLogs = async () => {
    try {
        const response = await fetch('/api/logger/getLogs');
        const { logs } = await response.json();

        currentLogsLength = logs.length;
        updateLogContainer(logs);
    } catch (error) {
        console.error("Error fetching bot logs:", error);
    }
};

/**
 * Refresh the current bot logs
 */
const refreshLogs = async (logsLength) => {
    try {
        const response = await fetch('/api/logger/refreshLogs', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentLogsLength: logsLength })
        });

        const data = await response.json();

        if (data.status === 'SAME_LENGTH') {
            return;
        }
        else if (data.status === 'NEW_LOGS') {
            currentLogsLength += data.data.newLogs.length;
            updateLogContainer(data.data.newLogs);
        }
        else {
            throw Error('Refresh logs error');
        }
    } catch (error) {
        console.error("Error fetching bot logs:", error);
    }
};


document.addEventListener("DOMContentLoaded", async () => {
    const updateRefreshInterval = 5 * 1000;     // 'api_logger_update' 刷新時間 5s


    await getLogs();


    /**
     * logger_update 刷新計時器
     */
    // ------------------------------------------------- //

    setInterval(async () => {
        await refreshLogs(currentLogsLength);
    }, updateRefreshInterval);

    // ------------------------------------------------- //
});
