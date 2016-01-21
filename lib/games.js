var GameEngine = require('../test/gameEngine')
  , Level = require('../client/www/js/level.js')
  , realtime = require('./realtime')
  , config = require('./config')
  , games = {}
  , readies = {}
  ;


/**
 * When a new player signals his readiness, create game on the fly and send it to him
 */
realtime.on('player.ready', function (data) {
  var socket = data.socket;

  console.log("New player ready: " + socket.id);

  readies[socket.id] = socket;
  checkAndLaunch();

  socket.on('disconnect', function () {
    delete readies[socket.id];
  });
});


/**
 * Enough ready players, launch game
 */
function checkAndLaunch() {
  var sockets = []
    , socketsIds = Object.keys(readies);

  // TODO: more precise matching handling different screen sizes
  if (socketsIds.length < config.numberOfPlayers) { return; }

  console.log("Enough ready players, launching new game");

  socketsIds.forEach(function (id) {
    sockets.push(readies[id]);
    delete readies[id];
  });

  // Game indexed by "host" - first ready player - socket id
  var gameId = sockets[0].id;
  var game = games[gameId] = new Level({ tileTableWidth: 10, tileTableHeight: 5 });
  game.createNewLevel();
  var serializedLevel = game.serialize();
  socketsIds.forEach(function (id) {
    game.addNewPlayer(id);
  });

  sockets.forEach(function (socket) {
    socket.emit('game.begun', { serializedLevel: serializedLevel, startGameAfter: config.startGameAfter, playersIds: socketsIds, yourId: socket.id });

    socket.on('action.jump', function () {
      console.log("Received jump from player socket " + socket.id + " at time " + (Date.now() - game.gameStartTime));

      game.getPlayerById(socket.id).startJump();
    });
  });

  setTimeout(function () {
    game.gameStartTime = Date.now();
    console.log("Game started at " + game.gameStartTime);
  }, config.startGameAfter);
}


// No module.exports interface
