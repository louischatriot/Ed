var http = require('http')
  , app = http.createServer(globalHandler)
  , io = require('socket.io')(app)
  , config = require('./lib/config')
  , pings = {}
  , games = {}
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
    socket.emit('ping', { id: socket.id, sent: Date.now(), formerPing: pings[socket.id] });
  }, config.pingFrequency);

  // Stop pinging disconnected sockets
  socket.on('disconnect', function () {
    clearInterval(intervalId);
    delete pings[socket.id];
  });
}


/**
 * Launch new game right upon connection
 */
function Game (socket) {
  var self = this;
  this.beginning = Date.now();
  this.socket = socket;

  socket.on('action', function () {
    var time = Date.now() - self.beginning;
    console.log('New action received at time: ' + time + ' - adjusted for ping: ' + (time - pings[socket.id] / 2));
  });
}


function launchGame (socket) {
  games[socket.id] = new Game(socket);

  socket.on('disconnect', function () {
    delete games[socket.id];
  });
}


io.on('connection', function (socket) {
  console.log("New socket connected: " + socket.id);

  setupPing(socket);
  launchGame(socket);
});


app.listen(7777);
