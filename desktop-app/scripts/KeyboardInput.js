

function initializeKeyboardInputSystem() {
    document.addEventListener("keypress", handleKeyboardInput);
}


/**
 * 
 * @param {Document} document
 * @param {KeyboardEvent} event 
 */
function handleKeyboardInput(document, event) {

    const key = event.key.replace("Key", "").toLowerCase();

    if(
        !(key in ["n", "u", "d", "f", "b", "s"])
    ) {
        return;
    }

    window.electronAPI.onKeyboardInput(key);
}
