const { WebSocket } = require("./desktop-app/node_modules/ws/index");
const ws = new WebSocket("ws://localhost:4567/");

ws.on('error', console.error);

ws.on('open', function open() {
  console.log('connected');
  //ws.send(Date.now());
});

ws.on('close', function close() {
  console.log('disconnected');
});

ws.on('message', function message(data) {
  console.log(data)
});