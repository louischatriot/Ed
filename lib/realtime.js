var socketio = require('socket.io')
  , config = require('./config')
  ;

/**
 * Constructor and initialization
 * Realtime is an internal event emitter
 */
function Realtime () {
  this.pings = {};
}
require('util').inherits(Realtime, require('events'));

Realtime.prototype.initialize = function (httpServer) {
  var self = this;

  this.io = socketio(httpServer);

  this.io.on('connection', function (socket) {
    console.log("New socket connected: " + socket.id);

    self.setupPing(socket);

    socket.on('player.ready', function () {
      self.emit('player.ready', { socket: socket });
    });

    socket.on('disconnect', function () {
      console.log("Socket disconnected: " + socket.id);
    });
  });
};


/**
 * Ping system
 */
Realtime.prototype.setupPing = function (socket) {
  var self = this;

  socket.on('pong', function (data) {
    var ping = Date.now () - data.sent;
    self.pings[socket.id] = ping;
  });

  var intervalId = setInterval(function () {
    socket.emit('ping', { id: socket.id, sent: Date.now(), formerPing: self.pings[socket.id] });
  }, config.pingFrequency);

  // Stop pinging disconnected sockets
  socket.on('disconnect', function () {
    clearInterval(intervalId);
    delete self.pings[socket.id];
  });
}

Realtime.prototype.getPing = function (socket) {
  return this.pings[socket.id];
};


// Interface (singleton)
module.exports = new Realtime();
