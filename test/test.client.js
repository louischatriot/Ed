var socket = io('http://localhost:7777');

socket.on('ping', function (data) {
  console.log("Received ping");
  socket.emit('pong', data);
});

