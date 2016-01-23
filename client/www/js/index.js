/**
 * Launch game once it is created on server
 */
socket.on('game.begun', function (data) {
  //var renderer = new Renderer()
    //, game = new Level({})
    //, serverStartTime = Date.now() - (ping / 2)
    //, readyToJump = true   // Prevent key down from sending continuous jumps
    //, players = [], you
    //;

  console.log("====================");

  game.log("Received game data from server, creating local copy", true);
  console.log("YOU ARE PLAYER: " + data.yourId);

  // Attach events and draw background hile waiting for actual game start
  game.on('positions.updated', function () { renderer.drawNewFrame(game); });
  game.on('background.updated', function () { renderer.newBackground(); });
  game.update(0);

  // Initializing players
  data.playersIds.forEach(function (id) {
    game.addNewPlayer(id);
  });
  you = game.getPlayerById(data.yourId);
  you.isLocalPlayer = true;

  game.startTime = serverStartTime + data.startGameAfter;

  // DEV
  window.game = game;

  /**
   * Syncs from the server
   */
  socket.on('status', function (message) {
    game.log("Received status from server");
    console.log(message);

    var gap = message.idealTime - game.getIdealGameTime();

    game.update(gap);

    message.players.forEach(function (p) {
      if (p.id === you.id) { return; }   // You are authoritative on your position
      var player = game.getPlayerById(p.id);
      player.x = p.x;
      player.y = p.y;
      player.direction = p.direction;
      if (p.isJumping) { player.startJump(); }
    });

    game.update(gap * (-1));
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
      game.getPlayerById(you.id).startJump();
      readyToJump = false;
      socket.emit('action.jump', { actualTime: game.getGameTime(), idealTime: game.getIdealGameTime() });
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
    game.log("Game started");
    start();
  }, serverStartTime - Date.now() + data.startGameAfter);
});

