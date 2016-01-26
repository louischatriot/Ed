var renderer = new Renderer()
  , game, startGameAfter
  , players = []
  , you
  ;

/**
 * Prepare game (level creation, intitial rendering) upon receiving game data,
 * then warn server that client is ready to actually start the game
 * This two-step approach is necessary to avoid time disconnect between server
 * and clients, as we don't know how much time the level data transfer took
 */
socket.on('game.data', function (data) {
  console.log("Received game data");

  // Initialize game
  game = Level.deserialize(data.serializedLevel);
  game.on('positions.updated', function () { renderer.drawNewFrame(game); });
  game.on('background.updated', function () { renderer.newBackground(); });
  game.update(0);

  // Initialize players
  data.playersIds.forEach(function (id) {
    game.addNewPlayer(id);
  });
  you = game.getPlayerById(data.yourId);
  you.isLocalPlayer = true;
  console.log("YOU ARE PLAYER: " + data.yourId);

  startGameAfter = data.startGameAfter;

  socket.emit('game.prepared');
});



/**
 * Launch game once it is created on server and prepared on all clients
 */
socket.on('game.begin', function () {
  var readyToJump = true;   // Prevent key down from sending continuous jumps

  /**
   * Syncs from the server
   */
  socket.on('status', function (message) {
    game.log("Received status from server");
    console.log(message);

    var gap = message.idealTime - game.getIdealGameTime();
    // Gap needs to be negative or client will forget the jump
    // If client lags behind server (update step being non zero), update it as much as possible
    // Making gap negative
    if (gap > 0) {
      var newTime = Date.now();
      var timeGap = (newTime - lastTime);
      lastTime = newTime;
      game.update(speedBoost * timeDirection * timeGap);
      gap = message.idealTime - game.getIdealGameTime();
    }

    game.update(gap);

    message.players.forEach(function (p) {
      var player = game.getPlayerById(p.id);
      player.x = p.x;
      player.y = p.y;
      player.direction = p.direction;
      if (p.isJumping) { player.startJump(); }
    });

    game.update(gap * (-1));
    game.log("Client state updated");
  });



  /**
   * Interactions from the client
   */
  var startTouch = function(e) {
    // If F5 or i is pressed, trigger default action (reload page or launch dev tools)
    if (e.keyCode && (e.keyCode === 116 || e.keyCode === 73)) { return; }

    // Start/pause
    if (e.keyCode === 27) {
      if (intervalId !== undefined) { pause(); } else { start(); }
      return;
    }

    // Go back in time
    if (e.keyCode === 13) {
      timeDirection *= -1;
      return;
    }

    // Increase/decrease speed
    if (e.keyCode === 38) {
      speedBoost *= 1.1;
      return;
    }
    if (e.keyCode === 40) {
      speedBoost /= 1.1;
      return;
    }

    if (e.keyCode !== 32) { return }   // Uncomment to avoid noise during debugging
    e.preventDefault(); // preventing the touch from sliding the screen on mobile.
    if (readyToJump) {
      game.log("Sent jump command", true);
      you.startJump();
      readyToJump = false;
      socket.emit('action.jump', { actualTime: game.getGameTime(), idealTime: game.getIdealGameTime(), jumpStartedAt: you.jumpStartedAt });
    }
  }


  var endTouch = function(e) {
    e.preventDefault();
    readyToJump = true;
  }


  document.onkeydown = startTouch;
  document.onkeyup = endTouch;

  document.onmousedown = startTouch;
  document.onmouseup = endTouch;

  document.ontouchstart = startTouch;
  document.ontouchend = endTouch;


  /**
   * Main loop
   */
  var lastTime
    , intervalId = undefined
    , timeDirection = 1
    , speedBoost = 1
    , paused = false
    ;

  function main () {
    var newTime = Date.now();
    var timeGap = (newTime - lastTime);
    lastTime = newTime;
    game.update(speedBoost * timeDirection * timeGap);

    if (!paused) { setTimeout(main, 40); }
  }

  function start () {
    paused = false;
    lastTime = Date.now();
    main();
  }

  function pause () {
    paused = true;
  }

  // Start game after delay specified by the server
  setTimeout(function () {
    game.startTime = Date.now();
    game.log("Game started");
    start();
  }, startGameAfter - (ping / 2));
});

