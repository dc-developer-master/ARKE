const { app, BrowserWindow, ipcMain } = require("electron");
const ws = require("ws");
const hid = require("node-hid");
const path = require("path");
const http = require("http");
const os = require("os");
const axios = require("axios").default;

const device = new hid.HID(1133, 49685);
const websocketServer = new ws.WebSocketServer({ port: 4567 });

function createWindow() {
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        }
    });

    window.loadFile("index.html");
}

app.whenReady().then(() => {

    initializeWebsocket(`ws://${getLocalIP()}`, 4567);

    createWindow();

    app.on("activate", () => {
        if(BrowserWindow.getAllWindows().length == 0) {
            createWindow();
        }
    });

    device.on("data", handle_hid);

    websocketServer.on("connection", websocketHandleConnection);
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
    
    sendBroadcastData(buffer);
    delete buffer;
}

ipcMain.on("onKeyboardInput", (event, key) => {
    const buffer = Buffer.alloc(2);
    buffer.writeUInt8(0x01, 0);
    buffer.write(key, 1);

    sendBroadcastData(buffer);
    delete buffer;
});

function websocketHandleConnection(socket, url) {
    console.log("new client connected");
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

process.on("SIGINT", () => {
    websocketServer.close();
    device.close();
    app.quit();
    process.exit();
});