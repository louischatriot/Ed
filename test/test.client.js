var socket = io('http://localhost:7777')
  , originalOn = socket.constructor.prototype.on
  , originalEmit = socket.constructor.prototype.emit
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
  if (data.formerPing) { document.getElementById('ping').innerHTML = 'Ping (ms): ' + data.formerPing; }
  socket.emit('pong', data);
});


/**
 * Game
 */
var beginning = Date.now();

document.onkeydown = function (e) {
  if (e.keyCode === 32) {
    var time = Date.now() - beginning;
    document.getElementById('actions').innerHTML += 'Action sent at time: ' + time + '<br>';

    socket.emit('action');
  }
};




// Initialization
var qs = getQueryString();
var delay = parseInt(qs.delay, 10) || 0;   // Ping delay for testing purposes
currentDelay = delay;

