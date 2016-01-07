/**
 * Cyclic array, all indices are cast to a range of the given size (between 0 and size - 1)
 * this.i always points to the latest inserted element
 */
function CyclicArray (size) {
  this.a = [];
  this.i = size - 1;
  this.size = size;

  this.stales = [];
  for (var i = 0; i < size; i += 1) { this.stales[i] = true; }
}

CyclicArray.prototype.push = function (elt) {
  this.i += 1;
  if (this.i >= this.size) { this.i -= this.size; }
  this.a[this.i] = elt;
  this.stales[this.i] = false;
};

CyclicArray.prototype.getLatest = function () {
  if (this.stales[this.i]) { throw "Can't access stale element"; }
  return this.a[this.i];
};

// Nth from the beginning, latest being 0
CyclicArray.prototype.getNth = function (_n) {
  var n = this.i - _n;
  if (n < 0) { n += this.size; }
  if (this.stales[n]) { throw "Can't access stale element"; }
  return this.a[n];
};

CyclicArray.prototype.staleLatest = function () {
  this.stales[this.i] = true;
  this.i -= 1;
  if (this.i < 0) { this.i += this.size; }
};

CyclicArray.prototype.pop = function () {
  var elt = this.getLatest();
  this.staleLatest();
  return elt;
};

// Execute a function on all non stale elements, in reverse chronological order
CyclicArray.prototype.reverseExecute = function (fn) {
  for (var n = 0; n < this.size; n += 1) {
    try {
      fn(this.getNth(n));
    } catch (e) {}   // Do nothing on error
  }
};


/**
 * Robot (can be player or an ennemy)
 */
function Robot(tile, level, speed, isEnnemy) {
  this.level = level; // The level the Robot is currently playing in
  this.x = tile.center().x;
  this.y = tile.center().y;
  this.direction = Robot.directions.RIGHT;

  this.kyu = 25; // How strong is this Robot? Probably should be in AI or in player's info.

	this.jumpStartedAt = undefined;   // Position current jump was started

  this.direction = this.nextDirection(); // 0 = right, 1 = up, 2 = left, 3 = down
	this.speed = speed;
	this.isEnnemy = isEnnemy;

  // Remember latest history. For the beginning we consider that we spent an eternity up to now on the start tile
  var nTilesToRemember = Math.floor(Robot.timeToRemember * this.speed) * 3;
  this.controlPoints = new CyclicArray(nTilesToRemember);
  for (var i = 0; i < nTilesToRemember; i += 1) { this.controlPoints.push({ position: tile.center(), direction: this.direction }); }

  this.listeners = {};

  this.alwaysTurnsRight = false; // enables maximal theoretical exploration
}

Robot.directions = { RIGHT: 'right', UP: 'up', LEFT: 'left', DOWN: 'down' };

// TODO: extenralize in config object, redundancy with renderer
Robot.timeToRemember = 3500;   // In ms, how much history to remember for this robot
Robot.jumpLength = 0.8;   // As percentage of tile length


Robot.prototype.emit = function (evt, message) {
  if (this.listeners[evt]) {
    this.listeners[evt].forEach(function (fn) { fn(message); });
  }
};

Robot.prototype.on = function(evt, listener) {
  if (!this.listeners[evt]) { this.listeners[evt] = []; }
  this.listeners[evt].push(listener);
};


Robot.prototype.cloneFrom = function(anotherRobot) {
  this.level = anotherRobot.level;
  this.x = anotherRobot.x;
  this.y = anotherRobot.y;
  this.speed = anotherRobot.speed;
  this.direction = anotherRobot.direction;
  this.isEnnemy = anotherRobot.isEnnemy;
  this.AIControlled = anotherRobot.AIControlled;
}


function getOppositeDirection (direction) {
  if (direction === Robot.directions.UP) { return Robot.directions.DOWN; }
  if (direction === Robot.directions.DOWN) { return Robot.directions.UP; }
  if (direction === Robot.directions.LEFT) { return Robot.directions.RIGHT; }
  if (direction === Robot.directions.RIGHT) { return Robot.directions.LEFT; }
}


Robot.prototype.nextTile = function(_tile, _direction) {
  var tile = _tile || this.getTile()
    , direction = _direction || this.direction
    ;

  if (!tile) { return null; }

  var i = tile.i;
  var j = tile.j;
  if (direction == Robot.directions.RIGHT && i < this.level.tileTableWidth - 1) { return this.level.tileTable[i + 1][j]; }
  if (direction == Robot.directions.LEFT && i > 0) { return this.level.tileTable[i - 1][j]; }
  if (direction == Robot.directions.UP && j > 0) { return this.level.tileTable[i][j - 1]; }
  if (direction == Robot.directions.DOWN && j < this.level.tileTableHeight - 1) { return this.level.tileTable[i][j + 1]; }

  // No tile found, return null
  return null;
}


Robot.prototype.reposition = function(tile) {
	this.x = tile.center().x;
	this.y = tile.center().y;
  this.jumpStartedAt = undefined;
  this.direction = Robot.directions.RIGHT;
  this.direction = this.nextDirection();
}


// TODO: maybe implement jump cooldown
Robot.prototype.startAJump = function() {
  if (! this.isJumping()) {
    this.jumpStartedAt = { x: this.x, y: this.y };
    this.controlPoints.push({ position: this.jumpStartedAt, direction: this.direction, jumpStart: true });
  }
}


Robot.prototype.isJumping = function() {
  return this.controlPoints ? this.analyzeJump().isJumping : false;
}


Robot.prototype.distanceTo = function(anotherRobot) {
  return (this.x - anotherRobot.x) * (this.x - anotherRobot.x) + (this.y - anotherRobot.y) * (this.y - anotherRobot.y);
}

// optimized collision function

Robot.prototype.collisionWith = function(anotherRobot) {
  var r = 2 / 5;
  if (Math.abs(anotherRobot.x - this.x) < r && Math.abs(anotherRobot.y - this.y) < r && this.distanceTo(anotherRobot) < r * r) {
      return true;
  }
  return false;
}


Robot.prototype.checkInterception = function() {
  var e = this.level.ennemyTable;
  for (var i = 0; i < this.level.ennemyTable.length; i += 1) {
    if (this.collisionWith(this.level.ennemyTable[i])) { return true; }
  }
  return false;
}


Robot.prototype.hitEnnemy = function() {
  this.reposition(this.level.startingTile);
}



/**
 * Get the next direction the robot can go to. Try first to keep the same direction (if no wall ahead or jumping)
 * Then try clockwise starting from the right of the current direction while avoiding to go in the opposite direction
 * If forced, go back the opposite direction
 */
Robot.prototype.nextDirection = function() {
  var dirSequence = [Robot.directions.UP, Robot.directions.RIGHT, Robot.directions.DOWN, Robot.directions.LEFT, Robot.directions.UP, Robot.directions.RIGHT, Robot.directions.DOWN, Robot.directions.LEFT]
    , tileWalls = {};

  // TODO: this is of course not satisfying, we should use the same structure for indexing tile walls
  tileWalls[Robot.directions.UP] = this.getTile().upWall;
  tileWalls[Robot.directions.RIGHT] = this.getTile().rightWall;
  tileWalls[Robot.directions.DOWN] = this.getTile().downWall;
  tileWalls[Robot.directions.LEFT] = this.getTile().leftWall;

  if (this.isJumping() && tileWalls[this.direction] !== Tile.wallType.HARD) {
    return this.direction;
  }

  var plus = 0;
  if (this.alwaysTurnsRight) { plus = 1; }

  for (var i = dirSequence.indexOf(this.direction) + plus; i < dirSequence.length; i += 1) {
    if (tileWalls[dirSequence[i]] === Tile.wallType.NOWALL && getOppositeDirection(this.direction) !== dirSequence[i]) { return dirSequence[i]; }
  }

  return getOppositeDirection(this.direction);
}


Robot.prototype.analyzeJump = function () {
  var distance = 0
    , jumping = false
    , lastPoint = this
    , n = 0
    , controlPoint;

  while (controlPoint = this.controlPoints.getNth(n)) {
    distance += absDistance(controlPoint.position,lastPoint);
    lastPoint = controlPoint.position;
    if (controlPoint.jumpStart) {
      if (distance < Robot.jumpLength) {
        return {isJumping: true, distanceSinceStart: distance};
      } else {
        break;
      }
    }
    if (distance > Robot.jumpLength || controlPoint.killedPosition || controlPoint.justKilled) { break; }
    n++;
  }

  return {isJumping: false, distanceSinceStart: 0};
}



/**
 * Update position
 * @param {Number} timeGap Number of milliseconds ellapsed since robot was last updated, can be negative to move backwards in time
 */
Robot.prototype.updatePosition = function (timeGap) {
  // Get hit by ennemy: immediately stop jump and go back to start
  if (! this.isEnnemy && this.checkInterception()) {
    if (this.isJumping()) {
      this.controlPoints.push({ position: { x: this.x, y: this.y }, direction: this.direction, jumpEnd: true, jumpStartedAt: this.jumpStartedAt });
    }
    this.jumpStartedAt = undefined;
    this.controlPoints.push({ position: { x: this.x, y: this.y }, direction: this.direction, killedPosition: true });
    this.reposition(this.level.tileTable[0][0]);
    this.controlPoints.push({ position: { x: this.x, y: this.y }, direction: this.direction, justKilled: true });
    return;
  }

  var movement = timeGap * this.speed;
  if (movement === 0) { return; }

  if (movement < 0) {   // Going back in time
    movement = -movement;
    var controlPoint, movementToPerform, staleControlPoint;

    while (movement > 0) {
      controlPoint = this.controlPoints.getLatest();
      staleControlPoint = this.movementTo(controlPoint.position) < movement;
      movementToPerform = Math.min(movement, this.movementTo(controlPoint.position));
      movement -= movementToPerform;
      this.move(movementToPerform, getOppositeDirection(controlPoint.direction));

      if (staleControlPoint) {
        this.controlPoints.staleLatest();
        this.direction = this.controlPoints.getLatest().direction;

        //if (controlPoint.jumpStart) { this.jumpStartedAt = undefined; }
        //if (controlPoint.jumpEnd) { this.jumpStartedAt = controlPoint.jumpStartedAt; }
        if (controlPoint.justKilled) {
          var killedPosition = this.controlPoints.pop().position;
          this.x = killedPosition.x; this.y = killedPosition.y; }
      }
    }

  } else {   // Going forward in time
    var movementToPerform, registerControlPoint, controlPoint
      , jumpEnd, remainingJump, controlPointPosition, controlPointIsJump;

    while (movement > 0) {
      controlPointIsJump = false;
      var jump = this.analyzeJump();
      if (jump.isJumping) {
        jumpEnd = { x: this.x, y: this.y };
        remainingJump = Robot.jumpLength - jump.distanceSinceStart;
        jumpEnd = Robot.translate(jumpEnd, remainingJump, this.direction);
      }

      controlPointPosition = this.getNextCenter();
      if (jumpEnd && this.movementTo(jumpEnd) < this.movementTo(controlPointPosition)) {
        controlPointPosition = jumpEnd;
        controlPointIsJump = true;
      }

      registerControlPoint = this.movementTo(controlPointPosition) <= movement;
      movementToPerform = Math.min(movement, this.movementTo(controlPointPosition));
      movement -= movementToPerform;
      this.move(movementToPerform);

      if (registerControlPoint) {
        controlPoint = { position: controlPointPosition };
        if (controlPointIsJump) {
          controlPoint.jumpEnd = true;
          controlPoint.jumpStartedAt = this.jumpStartedAt;
          this.jumpStartedAt = undefined;
          jumpEnd = undefined;
        } else {
          this.direction = this.nextDirection();
          /*if (this.tile.isObjective) { // TODO: Robots don't have tiles anymore.
            //this.emit('won'); // TODO: currently doesn't seem to work.
            this.level.nextDifficulty(); // won't need this once emit works.
          }*/

          this.emit('justPassedIntersection'); //send event for AI.
        }
        controlPoint.direction = this.direction;
        this.controlPoints.push(controlPoint);
      }
    }
  }
}


/**
 * Move robot by quantity movement in direction direction (defaulting to robot's current direction)
 */
Robot.prototype.move = function (movement, _direction) {
  var direction = _direction || this.direction;

  if (direction === Robot.directions.RIGHT) { this.x += movement; }
  if (direction === Robot.directions.UP) { this.y -= movement; }
  if (direction === Robot.directions.LEFT) { this.x -= movement; }
  if (direction === Robot.directions.DOWN) { this.y += movement; }
};


/**
 * Translate point by movement in direction direction
 * Doesn't modifiy the point itself, creates a deep copy and returns it
 */
Robot.translate = function (point, movement, direction) {
  var res = { x: point.x, y: point.y };

  if (direction === Robot.directions.RIGHT) { res.x += movement; }
  if (direction === Robot.directions.UP) { res.y -= movement; }
  if (direction === Robot.directions.LEFT) { res.x -= movement; }
  if (direction === Robot.directions.DOWN) { res.y += movement; }

  return res;
};


/**
 * Get tile containing point (_x, _y), by default where the Robot is Tile is inclusive of left and top walls, exclusive of right and down walls
 * Return null if out of tile table
 */
Robot.prototype.getTile = function (_x, _y) {
  var x = _x !== undefined ? _x : this.x
    , y = _y !== undefined ? _y : this.y;

  if (this.level.tileTable[Math.floor(x)] && this.level.tileTable[Math.floor(x)][Math.floor(y)]) {
    return this.level.tileTable[Math.floor(x)][Math.floor(y)];
  } else {
    return null;
  }
};


/**
 * Get center Robot is moving towards
 */
Robot.prototype.getNextCenter = function () {
  var x = this.x, y = this.y;
  if (this.direction === Robot.directions.RIGHT) { x += 1 / 2; }
  if (this.direction === Robot.directions.DOWN) { y += 1 / 2; }
  if (this.direction === Robot.directions.UP) {
    y -= 1 / 2;
    if (y === Math.floor(y)) { y -= 0.01; }   // Tiles are exclusive of top border
  }
  if (this.direction === Robot.directions.LEFT) {
    x -= 1 / 2;
    if (x === Math.floor(x)) { x -= 0.01; }   // Tiles are exclusive of left border
  }

  return this.getTile(x, y).center();
};


/**
 * Get movement needed from Robot to reach point
 * Can be passed two coordinates or a point { x, y }
 */
Robot.prototype.movementTo = function (x, y) {
  if (y === undefined) {
    y = x.y;
    x = x.x;
  }

  return Math.abs(this.x - x) + Math.abs(this.y - y);
};


/**
 * For debugging
 */
Robot.prototype.printControlPoints = function () {
  this.controlPoints.reverseExecute(function (cp) {
    var msg = cp.position.x + ' - ' + cp.position.y + ' ; ' + cp.direction;
    if (cp.jumpStart) { msg += ' ; jump start'; }
    if (cp.jumpEnd) { msg += ' ; jump end'; }
    if (cp.justKilled) { msg += ' ; just killed'; }
    console.log(msg);
  });
};


/**
 * Move robot by quantity movement in direction direction (defaulting to robot's current direction)
 */
Robot.prototype.move = function (movement, _direction) {
  var direction = _direction || this.direction;

  if (direction === Robot.directions.RIGHT) { this.x += movement; }
  if (direction === Robot.directions.UP) { this.y -= movement; }
  if (direction === Robot.directions.LEFT) { this.x -= movement; }
  if (direction === Robot.directions.DOWN) { this.y += movement; }
};


/**
 * Get tile containing point (_x, _y), by default where the Robot is Tile is inclusive of left and top walls, exclusive of right and down walls
 * Return null if out of tile table
 */
Robot.prototype.getTile = function (_x, _y) {
  var x = _x !== undefined ? _x : this.x
    , y = _y !== undefined ? _y : this.y;

  if (this.level.tileTable[Math.floor(x)] && this.level.tileTable[Math.floor(x)][Math.floor(y)]) {
    return this.level.tileTable[Math.floor(x)][Math.floor(y)];
  } else {
    return null;
  }
};


/**
 * Get center Robot is moving towards
 */
Robot.prototype.getNextCenter = function () {
  var x = this.x, y = this.y;
  if (this.direction === Robot.directions.RIGHT) { x += 1 / 2; }
  if (this.direction === Robot.directions.DOWN) { y += 1 / 2; }
  if (this.direction === Robot.directions.UP) {
    y -= 1 / 2;
    if (y === Math.floor(y)) { y -= 0.01; }   // Tiles are exclusive of top border
  }
  if (this.direction === Robot.directions.LEFT) {
    x -= 1 / 2;
    if (x === Math.floor(x)) { x -= 0.01; }   // Tiles are exclusive of left border
  }

  return this.getTile(x, y).center();
};


/**
 * Get movement needed from Robot to reach point
 * Can be passed two coordinates or a point { x, y }
 */
Robot.prototype.movementTo = function (x, y) {
  if (y === undefined) {
    y = x.y;
    x = x.x;
  }
  return Math.abs(this.x - x) + Math.abs(this.y - y);
};


var absDistance = function(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}


