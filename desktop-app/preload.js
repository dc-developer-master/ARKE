const { contextBridge, ipcRenderer } = require("electron/renderer");


window.addEventListener("DOMContentLoaded", () => {
    console.log("Application started to loading");
});

contextBridge.exposeInMainWorld("electronAPI", {
    onSidestickInput: (callback) => ipcRenderer.on("onSidestickInput", (event, value) => callback(value))
});