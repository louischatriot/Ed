var socket = io('http://localhost:7777');

function getQueryString () {
  var qs = window.location.href.match(/[^\?]+\?(.+)/);
  if (!qs) { return {}; }

  var res = {};
  qs = qs[1].split('&').forEach(function (e) {
    res[e.split('=')[0]] = e.split('=')[1];
  });

  return res;
}

var qs = getQueryString();
var delay = parseInt(qs.delay, 10) || 0;   // Ping delay for testing purposes

socket.on('ping', function (data) {
  var d = Date.now();
  setTimeout(function () {
    socket.emit('pong', data);
  }, delay);
});

