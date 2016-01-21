var GameEngine = require('../test/gameEngine')
  , Level = require('../client/www/js/level.js')
  , realtime = require('./realtime')
  , games = {}
  ;


/**
 * When a new player signals his readiness, create game on the fly and send it to him
 */
realtime.on('player.ready', function (data) {
  console.log("New player ready, creating game");

  var socket = data.socket;

  games[socket.id] = new Level({ tileTableWidth: 10, tileTableHeight: 5 });
  games[socket.id].createNewLevel();

  socket.emit('game.begun', { level: games[socket.id].serialize() });

  socket.on('action', function () {
    //games[socket.id].receiveCommand(socket.id, Date.now() - (realtime.getPing(socket) / 2));
  });

  socket.on('disconnect', function () {
    delete games[socket.id];
  });
});



// No module.exports interface
