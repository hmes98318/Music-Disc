/**
 * Required
 * <script src="/static/js/utils/sendControlRequest.js"></script>
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
    logsContainer.innerHTML += convertAnsiToHtml(logs.join('<br>'));
    scrollToBottom();
};

/**
 * Get the localnode log for initial loading
 */
const getLocalnodeLogs = async () => {
    try {
        const { logs } = await (await fetch('/api/localnode/getLogs')).json();

        currentLogsLength = logs.length;
        updateLogContainer(logs);
    } catch (error) {
        console.error("Error fetching local node logs:", error);
    }
};

/**
 * Get the localnode active status
 */
const getLocalnodeActive = async () => {
    const localnodeStatusContainer = document.getElementById('localnode-status');

    try {
        const { active } = await (await fetch('/api/localnode/isActive')).json();

        const statusText = (active === true) ? '<div class="active-status">Active</div>' : '<div class="inactive-status">Inactive</div>';
        localnodeStatusContainer.innerHTML = `<p>${statusText}</p>`;
    } catch (error) {
        console.error("Error fetching local node active:", error);
        localnodeStatusContainer.innerHTML = `<p><div class="inactive-status">Inactive</div></p>`;
    }
};

/**
 * Refresh the current localnode logs
 */
const refreshLocalnodeLogs = async (logsLength) => {
    try {
        const response = await fetch('/api/localnode/refreshLogs', {
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
            throw Error('Refresh localnode logs error');
        }
    } catch (error) {
        console.error("Error fetching local node logs:", error);
    }
};


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


    // Get logs
    await getLocalnodeLogs();
    await getLocalnodeActive();


    /**
     * localnode_active, localnode_update 刷新計時器
     */
    // ------------------------------------------------- //

    setInterval(async () => {
        await Promise.allSettled([
            getLocalnodeActive(),
            refreshLocalnodeLogs(currentLogsLength)
        ]);
    }, updateRefreshInterval);

    // ------------------------------------------------- //
});