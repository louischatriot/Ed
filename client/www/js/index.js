/**
 * Launch game once it is created on server
 */
socket.on('game.begun', function (data) {
  var renderer = new Renderer()
    , game = Level.deserialize(data.serializedLevel)
    , serverStartTime = Date.now() - (ping / 2)
    , readyToJump = true   // Prevent key down from sending continuous jumps
    , gameStartTime
    , players = [], you
    ;

  console.log("RECEIVED GAME BEGUN EVENT AT SERVER TIME: " + data.serverGameTime);
  console.log("SERVER SENT MESSAGE AT LOCAL TIME: " + serverStartTime);
  console.log("YOU ARE PLAYER: " + data.yourId);

  // Remains to be seen: should we render a new frame every time the physics engine is updated?
  game.on('positions.updated', function () { renderer.drawNewFrame(game); });
  game.on('background.updated', function () { renderer.newBackground(); });

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
    console.log("RECEIVED STATUS FROM THE SERVER AT " + game.getGameTime());
    console.log(message);

    message.players.forEach(function (player) {
      var localCopy = game.getPlayerById(player.id);

      if (Math.abs(localCopy.x - player.x) + Math.abs(localCopy.y - player.y)) {
        console.log("Player " + player.id + " out of sync - " + player.x + ' - ' + player.y + ' VS ' + localCopy.x + ' - ' + localCopy.y);
      }

      //if (p.id === you.id) { return; }   // You are authoritative on your position
      //var player = game.getPlayerById(p.id);
      //player.x = p.x;
      //player.y = p.y;
      //if (p.isJumping) { player.startJump; }
    });
  })



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
      game.getPlayerById(you.id).startJump();
      readyToJump = false;
      console.log("JUMP COMMAND FROM YOU AT " + game.getGameTime());
      socket.emit('action.jump', { clientGameTime: game.getGameTime() });
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
    ;

  function main () {
    var newTime = Date.now();
    var timeGap = (newTime - lastTime);
    lastTime = newTime;
    game.update(speedBoost * timeDirection * timeGap);
  }

  function start () {
    lastTime = Date.now();
    intervalId = setInterval(main, 40);
  }

  function pause () {
    clearInterval(intervalId);
    intervalId = undefined;
  }

  // Start game after delay specified by the server
  setTimeout(function () {
    console.log("GAME STARTED AT " + game.getGameTime());
    game.currentTime = game.startTime;
    game.update(0);
    start();
  }, serverStartTime - Date.now() + data.startGameAfter);
});

