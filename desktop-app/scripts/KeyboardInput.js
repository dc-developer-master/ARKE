

function initializeKeyboardInputSystem() {
    document.addEventListener("keypress", handleKeyboardInput);
}


/**
 * 
 * @param {Document} document
 * @param {KeyboardEvent} event 
 */
function handleKeyboardInput(document, event) {
    const buffer = new Uint8Array();
    const key = event.key.replace("Key", "").toLowerCase();

    if(
        !(key in ["n", "u", "d", "f", "b", "s"])
    ) {
        delete buffer;
        return;
    }

    buffer.set([ 0x01, key ]);

    sendToWebsocket(buffer);
    delete buffer;
}
