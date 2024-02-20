

function __initializeWebsocket() {
    window.electronAPI.initializeWebsocket();
}

/**
 * @param {Uint8Array} data data to send
 */
function sendToWebsocket(data) {
    window.electronAPI.sendToWebsocket(data);
}
