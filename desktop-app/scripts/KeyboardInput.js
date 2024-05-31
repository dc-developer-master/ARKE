
const keyBindings = ["n", "u", "d", "f", "b", "s", "q"];

function initializeKeyboardInputSystem() {
    document.addEventListener("keydown", handleKeyboardInput);
}


/**
 * 
 * @param {Document} document
 * @param {KeyboardEvent} event 
 */
async function handleKeyboardInput(event) {

    // deprecated
    // const key = event.key.replace("Key", "").toLowerCase();
    // (key in ["n", "u", "d", "f", "b", "s", "q"])

    const key = event.key;

    if(
        keyBindings.indexOf(key) < 0
    ) {
        return;
    }

    console.log(key);

    window.electronAPI.onKeyboardInput(key);

}
