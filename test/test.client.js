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
    document.getElementById('ping').innerHTML = 'Ping (ms): ' + ping;
    if (pingWasUndefined) {   // There should be a better way, with once event emitter
      pingWasUndefined = false;
      playerIsReady();
    }
  }
  socket.emit('pong', data);
});


/**
 * Launch game once created on server
 */
socket.on('game.begun', function (data) {
  console.log("Received game from server");

  data.beginning = Date.now() - ping / 2;
  var gameEngine = new GameEngine(data);
  var totalTime = gameEngine.level[gameEngine.level.length - 1].end;

  gameEngine.level.forEach(function (point) {
    var left = 100 * point.beginning / totalTime;
    var width = 100 * (point.end - point.beginning) / totalTime;
    var $box = $('<div style="position: fixed; background-color: steelblue;"></div>');
    $box.css('height', '30px');
    $box.css('top', '100px');
    $box.css('width', width + '%');
    $box.css('left', left + '%');
    $('body').append($box);
  });

  var $line = $('<div id="line" style="position: fixed; width: 2px; background-color: red;"></div>');
  $line.css('height', '70px');
  $line.css('top', '80px');
  $line.css('left', '0');

  $('body').append($line);

  setInterval(function () {
    $('#line').css('left', Math.min(100, 100 * gameEngine.getLocalTime() / totalTime) + '%');
  }, 20);

  document.onkeydown = function (e) {
    if (e.keyCode === 32) {
      gameEngine.receiveCommand('self', Date.now());
      socket.emit('action');
    }
  };
});






// Initialization
var qs = getQueryString();
var delay = parseInt(qs.delay, 10) || 0;   // Ping delay for testing purposes
currentDelay = delay;

function playerIsReady () {
  socket.emit('player.ready');
}

