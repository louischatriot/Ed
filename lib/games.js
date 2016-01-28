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
    , socketsIds = Object.keys(readies)
    , preparedClients = {};

  // TODO: more precise matching handling different screen sizes
  if (socketsIds.length < config.numberOfPlayers) { return; }

  console.log("Enough ready players, launching new game");

  socketsIds.forEach(function (id) {
    sockets.push(readies[id]);
    delete readies[id];
  });

  // STEP 1: create and serialize the game
  // Game indexed by "host" - first ready player - socket id
  var gameId = sockets[0].id;
  var game = games[gameId] = new Level({ tileTableWidth: 35, tileTableHeight: 25 });
  game.createNewLevel();
  var serializedLevel = game.serialize();
  socketsIds.forEach(function (id) {
    game.addNewPlayer(id);
  });

  // STEP 3b: Called whenever a client tells the server it has prepared the game, launch game when all clients are prepared
  function checkEveryClientPrepared () {
    if (Object.keys(preparedClients).length < sockets.length) { return; }   // Of course not fail safe, need to implement 1 to 1 check

    setTimeout(function () {
      game.startTime = Date.now();
      game.update(0);
      game.log("Game started", true);
    }, config.startGameAfter);

    sockets.forEach(function (socket) {
      socket.emit('game.begin');
    });

    sockets.forEach(function (socket) {
      socket.on('action.jump', function (msg) {
        game.log("Received jump", true);
        console.log("Received jump from player socket " + socket.id + " at server actual time " + game.getGameTime() + " and client actual time " + msg.actualTime + " with ping " + realtime.getPing(socket));

        if (game.getGameTime() - msg.actualTime - (realtime.getPing[socket] / 2) > 20) {
          console.log("ERROR - Client actual time is too much behin server time, even corrected for ping. Probable abuse.");
        }
        // TODO: symetric check if server is lagging behind
        // TODO: check that robbot didn't teleport with idealTime

        // Update server game state and time up to client's ideal time
        var gap = msg.idealTime - game.getIdealGameTime();
        game.update(gap)
        game.getPlayerById(socket.id).startJump();   // TODO: use accurate jump data
        game.log("Game up to date, jumped player", true);

        var message = { actualTime: game.getGameTime(), idealTime: game.getIdealGameTime(), players: [] };
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

  // STEP 3a: listen for prepared clients
  sockets.forEach(function (socket) {
    socket.on('game.prepared', function () {
      preparedClients[socket.id] = true;
      checkEveryClientPrepared();
    });
  });

  // STEP 2: send game data to clients
  game.log("Sending game data to clients", true);
  sockets.forEach(function (socket) {
    socket.emit('game.data', { serializedLevel: serializedLevel, startGameAfter: config.startGameAfter, playersIds: socketsIds, yourId: socket.id });
  });
}


// No module.exports interface
