const { app, BrowserWindow, ipcMain } = require("electron");
const ws = require("ws");
const hid = require("node-hid");
const path = require("path");
const http = require("http");
const axios = require("axios").default;
const net = require("net");

const device = new hid.HID(1133, 49685);
const httpServer = http.createServer();
const websocketServer = new ws.Server({ port: 4567 /* server: httpServer */ });
var wsInstance = null;

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

    createWindow();

    app.on("activate", () => {
        if(BrowserWindow.getAllWindows().length == 0) {
            createWindow();
        }
    });

    device.on("data", handle_hid);

    websocketServer.on("connection", websocketHandleConnection);

    //httpServer.listen(4567);

    initializeWebsocket("ws://192.168.1.12", 4567);
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
}

ipcMain.on("onKeyboardInput", (event, key) => {
    const buffer = Buffer.alloc(2);
    buffer.writeInt8(0x01);
    buffer.write(key);

    wsInstance.send(buffer);
    // delete buffer;
});

function websocketHandleConnection(socket, url) {
    wsInstance = socket;
    console.log("connected");
}

function initializeWebsocket(wsUrl, wsPort) {
    axios.get("http://arke.local/connect_ws", {
        headers: {
            "Ws-Url": wsUrl,
            "Ws-Port": wsPort
        }
    });
}

function getSelfIP() {
    var ip = null;
    var socket = net.createConnection(80, "google.com");

    socket.on("connect", () => {
        ip = socket.address().address;
        socket.end();
    })

    return ip;
}
