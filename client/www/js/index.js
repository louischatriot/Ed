var socket = io('http://localhost:7777')
  , originalOn = socket.constructor.prototype.on
  , originalEmit = socket.constructor.prototype.emit
  , pingWasUndefined = true
  , ping
  ;

/**
 * Fake symetric delay on the ping
 * Needs to be symetric to test all aspects of synchronization
 */
var currentDelay = 0

socket.constructor.prototype.on = function (evt, handler) {
  originalOn.call(socket, evt, function (data) {
    setTimeout(function () {
      handler(data);
    }, currentDelay);
  });
};

socket.constructor.prototype.emit = function (evt, data) {
  setTimeout(function () {
    originalEmit.call(socket, evt, data);
  }, currentDelay);
};


/**
 * Utilities
 */
function getQueryString () {
  var qs = window.location.href.match(/[^\?]+\?(.+)/);
  if (!qs) { return {}; }

  var res = {};
  qs = qs[1].split('&').forEach(function (e) {
    res[e.split('=')[0]] = e.split('=')[1];
  });

  return res;
}


/**
 * Ping
 */
socket.on('ping', function (data) {
  if (data.formerPing) {
    ping = data.formerPing;
    //document.getElementById('ping').innerHTML = 'Ping (ms): ' + ping;
    if (pingWasUndefined) {   // There should be a better way, with once event emitter
      pingWasUndefined = false;
      playerIsReady();
    }
  }
  socket.emit('pong', data);
});


/**
 * Launch game once it is created on server
 */
socket.on('game.begun', function (data) {
  var renderer = new Renderer()
    , level = Level.deserialize(data.level)
    , p = level.addANewPlayer();
    ;

  // Remains to be seen: should we render a new frame every time the physics engine is updated?
  level.on('positions.updated', function () { renderer.drawNewFrame(level); });
  level.on('background.updated', function () { renderer.newBackground(); });


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

    //if (e.keyCode !== 32) { return }   // Uncomment to avoid noise during debugging
    e.preventDefault(); // preventing the touch from sliding the screen on mobile.
    level.startTouch();
  }


  var endTouch = function(e) {
    e.preventDefault();
    level.endTouch();
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
    level.update(speedBoost * timeDirection * timeGap);
  }

  function start () {
    lastTime = Date.now();
    intervalId = setInterval(main, 20);
  }

  function pause () {
    clearInterval(intervalId);
    intervalId = undefined;
  }

  level.update(0);
  start();
});



// Initialization
var qs = getQueryString();
var delay = parseInt(qs.delay, 10) || 0;   // Ping delay for testing purposes
currentDelay = delay;

function playerIsReady () {
  console.log('SENDING READY EVENT TO SERVER');
  socket.emit('player.ready');
}

