var GameEngine = require('./gameEngine')
  , realtime = require('./realtime')
  , games = {}
  ;


/**
 * When a new player signals his readiness, create game on the fly and send it to him
 */
realtime.on('player.ready', function (data) {
  console.log("New player ready, creating game");

  var socket = data.socket;

  games[socket.id] = new GameEngine();
  socket.emit('game.begun');

  socket.on('action', function () {
    games[socket.id].receiveCommand(socket.id, Date.now() - (realtime.getPing(socket) / 2));
  });

  socket.on('disconnect', function () {
    delete games[socket.id];
  });
});



// No module.exports interface
