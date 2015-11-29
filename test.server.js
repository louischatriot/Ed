var http = require('http')
  , app = http.createServer(globalHandler)
  , io = require('socket.io')(app)
  , config = require('./lib/config')
  , pings = {}
  ;

function globalHandler (req, res) {
  if (req.url === "/favicon.ico") {
    res.writeHead(200);
    return res.end();
  }

  res.writeHead(200, {'Content-Type': 'text/plain'});
  return res.end('Hello World\n');
}


/**
 * Setup ping system
 */
function setupPing (socket) {
  socket.on('pong', function (data) {
    var ping = Date.now () - data.sent;
    pings[socket.id] = ping;
  });

  var intervalId = setInterval(function () {
    socket.emit('ping', { id: socket.id, sent: Date.now() });
  }, config.pingFrequency);

  // Stop pinging disconnected sockets
  socket.on('disconnect', function () {
    clearInterval(intervalId);
    delete pings[socket.id];
  });
}


io.on('connection', function (socket) {
  console.log("New socket connected: " + socket.id);

  setupPing(socket);
});


app.listen(7777);
