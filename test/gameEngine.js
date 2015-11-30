function GameEngine (_options) {
  var options = _options || {};
  this.beginning = options.beginning || Date.now();
  //this.generateLevel(options.level);

  //console.log('LEVEL');
  //console.log(this.level);

  //socket.on('action', function () {
    //var time = Date.now() - self.beginning;
    //console.log('New action received at time: ' + time + ' - adjusted for ping: ' + (time - pings[socket.id] / 2));
  //});
}

/**
 * Generate new level
 * Either copy passed level or generate a random one given paramters
 * If level is an actual level it is an array of control points, otherwise it is an object { numControlPoints, totalTime }
 */
GameEngine.prototype.generateLevel = function (level) {
  if (Array.isArray(level)) {
    this.level = level;
    return;
  }

  var controlPoints = [], beg, point, time = 0;
  for (var i = 0; i < level.numControlPoints; i += 1) {
    beg = Math.floor(11 * Math.random());
    controlPoints.push(beg);
    time += beg + 3;
  }

  this.level = [];
  for (i = 0; i < level.totalTime; i += 1) {
    point = {};
    point.beginning = controlPoints[i] * totalTime / time;
    point.end = point.beginning + (3 * totalTime / time);
    this.level.push(point);
  }
};


/**
 * Receive new command (either from local player or server)
 */
GameEngine.prototype.receiveCommand = function (player, time) {
  console.log("Received command from player " + player + " at time offset: " + (time - this.beginning));
};



// Code shared on the server.
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') { module.exports = GameEngine; }
