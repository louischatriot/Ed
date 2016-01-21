/**
 * Handles ping system, fake ping and initialization (telling server that client is ready to play)
 */
var originalOn = socket.constructor.prototype.on
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




// Initialization
var qs = getQueryString();
var delay = parseInt(qs.delay, 10) || 0;   // Ping delay for testing purposes
currentDelay = delay;

function playerIsReady () {
  console.log('SENDING READY EVENT TO SERVER');
  socket.emit('player.ready');
}
