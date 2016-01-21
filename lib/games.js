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
    console.log("Actually starting game at: " + game.getGameTime());
    game.currentTime = game.startTime;
    game.update(0);
  }, config.startGameAfter);

  sockets.forEach(function (socket) {
    socket.emit('game.begun', { serializedLevel: serializedLevel, startGameAfter: config.startGameAfter, playersIds: socketsIds, yourId: socket.id, serverGameTime: game.getGameTime() });

    socket.on('action.jump', function (msg) {
      console.log("Received jump from player socket " + socket.id + " at server game time " + game.getGameTime() + " and client game time " + msg.clientGameTime + " with ping " + realtime.getPing(socket));

      // Update server game state and time up to server time when player jumped
      var newCurrentTime = Date.now() - (realtime.getPing(socket) / 2)
        , gap = newCurrentTime - game.currentTime
        ;

      game.update(gap);
      game.getPlayerById(socket.id).startJump();
      game.currentTime = newCurrentTime;

      var message = { serverGameTime: game.getGameTime(), players: [] };
      game.playerTable.forEach(function (player) {
        message.players.push({ x: player.x, y: player.y, isJumping: player.isJumping, id: player.id });
      });
      sockets.forEach(function (s) { s.emit('status', message); });
    });

    // Regularly send back to players the authoritative position from server
    //setInterval(function () {
      //var now = Date.now(), gap = now - game.currentTime;
      //game.update(gap);
      //game.currentTime = now;

      //var message = { players: [] };
      //game.playerTable.forEach(function (player) {
        //message.players.push({ x: player.x, y: player.y, isJumping: player.isJumping, id: player.id });
      //});
      //sockets.forEach(function (s) { s.emit('status', message); });
    //}, 80);
  });
}


// No module.exports interface
