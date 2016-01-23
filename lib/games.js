var Level = require('../client/www/js/level.js')
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

  // Record game start time (when all robots start to move)
  game.startTime = Date.now() + config.startGameAfter;
  console.log("Game will start at " + game.startTime);

  setTimeout(function () {
    game.update(0);
    game.log("Game started", true);
  }, config.startGameAfter);

  game.log("Sending game data to clients", true);
  sockets.forEach(function (socket) {
    game.log("Sending to socket " + socket.id, true);
    socket.emit('game.begun', { serializedLevel: serializedLevel, startGameAfter: config.startGameAfter, playersIds: socketsIds, yourId: socket.id, serverGameTime: game.getGameTime() });
    //socket.emit('game.begun');
    game.log("Sent to socket " + socket.id, true);

    socket.on('action.jump', function (msg) {
      game.log("Received jump", true);
      console.log("Received jump from player socket " + socket.id + " at server actual time " + game.getGameTime() + " and client actual time " + msg.actualTime + " with ping " + realtime.getPing(socket));

      if (game.getGameTime() - msg.actualTime - (realtime.getPing[socket] / 2) > 20) {
        console.log("ERROR - Client actual time is too much behin server time, even corrected for ping. Probable abuse.");
      }
      // TODO: symetric check if server is lagging behind

      // Update server game state and time up to client's ideal time
      var gap = msg.idealTime - game.currentTime;
      game.update(gap)
      game.getPlayerById(socket.id).startJump();
      game.log("Game up to date, jumped player");

      var message = { actualTime: game.getGameTime(), idealTime: game.getIdealGameTime(), players: [] };
      console.log("Sending the following message");
      console.log(message);
      game.playerTable.forEach(function (player) {
        message.players.push({ x: player.x
                             , y: player.y
                             , direction: player.direction
                             , isJumping: player.isJumping()
                             , id: player.id });
      });
      sockets.forEach(function (s) { s.emit('status', message); });
    });
  });
}


// No module.exports interface
