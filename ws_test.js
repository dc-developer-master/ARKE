const { WebSocketServer } = require("./desktop-app/node_modules/ws/index");

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  //ws.send('something');

  setInterval(() => {
    const buffer = Buffer.alloc(16);
    buffer.writeUInt8(0x01, 0);
    buffer.write('n', 1);
    ws.send(buffer);
    console.log(buffer);
  }, 1000);
});