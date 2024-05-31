

let canvas

function initializeSidestickDrawer() {
    const canvas_element = document.getElementById("sidestick_pointer");
    canvas = canvas_element.getContext("2d");
}

window.electronAPI.onSidestickInput(input => {
    canvas.reset();
    drawSidestickPointer(input);
});

/**
 * 
 * @param {Number} x1 
 * @param {Number} y1 
 * @param {Number} x2 
 * @param {Number} y2 
 */

function drawLine(x1, y1, x2, y2) {
    canvas.moveTo(x1, y1);
    canvas.lineTo(x2, y2);
    canvas.stroke();
}

function drawSidestickPointer(sidestick_input) {
    drawLine(
        (sidestick_input.roll - 16) / 2, 
        sidestick_input.pitch / 2, 
        (sidestick_input.roll + 16) / 2, 
        sidestick_input.pitch / 2
    );

    drawLine(
        sidestick_input.roll / 2, 
        (sidestick_input.pitch - 16) / 2, 
        sidestick_input.roll / 2, 
        (sidestick_input.pitch + 16) / 2
    );

    canvas.rect(0, 0, 512, 512);
    canvas.stroke();
}