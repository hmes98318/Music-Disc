/**
 * Control button handling
 */
// ------------------------------------------------- //

const sendControlRequest = async (type) => {
    const statusMessage = document.getElementById('status-message');
    const controlButtons = document.getElementById('control-buttons');
    let button;

    try {
        const data = { type: type };

        Array.from(controlButtons.getElementsByTagName('button'))
            .forEach((button) => {
                button.disabled = true;
            });


        // Update button status
        if (type === 'RESTART') {
            button = document.getElementById('restart-btn');
            button.innerText = 'Restarting';
        }
        else if (type === 'STOP') {
            button = document.getElementById('stop-btn');
            button.innerText = 'Stopping';
        }


        const response = await fetch('/api/localnode/controller', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        console.log('result', result);


        // Update button status and display status message
        if (result.result === 'SUCCEED') {
            statusMessage.innerHTML = `${result.type} request successful`;
            statusMessage.className = 'result-succeed';
        }
        else {
            statusMessage.innerHTML = `${result.type} request failed`;
            statusMessage.className = 'result-failed';
        }


        // Reset button status delay disappears
        const resetButton = () => {
            Array.from(controlButtons.getElementsByTagName('button'))
                .forEach((button) => {
                    button.disabled = false;
                });

            if (type === 'RESTART') {
                button.innerText = 'Restart';
            }
            else if (type === 'STOP') {
                button.innerText = 'Stop';
            }

            setTimeout(() => {
                statusMessage.innerHTML = '';
                statusMessage.className = '';
            }, 10 * 1000);
        };
        resetButton();
    } catch (error) {
        console.error('Error sending control request:', error);
    }
};

window.sendControlRequest = sendControlRequest;

// ------------------------------------------------- //