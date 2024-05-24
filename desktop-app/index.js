const { app, BrowserWindow, ipcMain } = require("electron");
const { WebSocketServer } = require("ws");
const hid = require("node-hid");
const path = require("path");
const http = require("http");
const os = require("os");
const cluster = require("cluster").default;
const axios = require("axios").default;

var device = new hid.HID(1133, 49685);
const websocketServer = new WebSocketServer({ port: 4567 });

function createWindow() {
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, "preload.js")
        }
    });

    window.loadFile("index.html");
}

app.whenReady().then(() => {

    ipcMain.on("onKeyboardInput", handleKeyboardInput);

    initializeWebsocket(`ws://${getLocalIP()}:8000/`, 8000);

    createWindow();

    app.on("activate", () => {
        if(BrowserWindow.getAllWindows().length == 0) {
            createWindow();
        }
    });

    device.on("data", handle_hid);

});


app.on("window-all-closed", () => {
    if(process.platform != "darwin") {
        app.quit();
    }
});

function handle_hid(data) {
    const ch = data.toString('hex').match(/.{1,2}/g).map(function (c) {
        return parseInt(c, 16);
    });

    const controls = {
        roll: ((ch[1] & 0x03) << 8) + ch[0],
        pitch: ((ch[2] & 0x0f) << 6) + ((ch[1] & 0xfc) >> 2),
        yaw: ch[3],
        view: (ch[2] & 0xf0) >> 4,
        throttle: -ch[5] + 255,
        buttons: [
            (ch[4] & 0x01) >> 0,
            (ch[4] & 0x02) >> 1,
            (ch[4] & 0x04) >> 2,
            (ch[4] & 0x08) >> 3,
            (ch[4] & 0x10) >> 4,
            (ch[4] & 0x20) >> 5,
            (ch[4] & 0x40) >> 6,
            (ch[4] & 0x80) >> 7,

            (ch[6] & 0x01) >> 0,
            (ch[6] & 0x02) >> 1,
            (ch[6] & 0x04) >> 2,
            (ch[6] & 0x08) >> 3
        ]
    };
    
    BrowserWindow.getAllWindows()[0].webContents.send("onSidestickInput", controls);
    const buffer = Buffer.alloc(11);
    buffer.writeUInt8(0x02, 0);
    buffer.writeUInt16LE(controls.roll, 1);
    buffer.writeUInt16LE(controls.pitch, 3);
    buffer.writeUInt16LE(controls.yaw, 5);
    buffer.writeUInt8(controls.view, 6);
    buffer.writeUInt8(controls.throttle, 7);
    buffer.writeUint16LE(controls.buttons, 8);
    
    //sendBroadcastData(buffer);
    delete buffer;
}

function handleKeyboardInput(event, key) {
    const buffer = Buffer.alloc(2);
    buffer.writeUInt8(0x01, 0);
    buffer.write(key, 1);

    sendBroadcastData(buffer);
    delete buffer;

    console.log(key);
}

function initializeWebsocket(wsUrl, wsPort) {
    axios.get("http://arke.local/connect_ws", {
        headers: {
            "Ws-Url": wsUrl,
            "Ws-Port": wsPort
        }
    });

}

function getLocalIP() {
    const networkInterfaces = os.networkInterfaces();
    for (const interface of Object.values(networkInterfaces)) {
        for (const config of interface) {
            if (config.family === 'IPv4' && !config.internal) {
                return config.address;
            }
        }
    }
}

function sendBroadcastData(buffer) {

    for(const client of websocketServer.clients) {
        client.send(buffer);
    }
}

websocketServer.on("connection", (socket, req) => {

    socket.on("message", buf => {
        console.log(buf);
    });
});
