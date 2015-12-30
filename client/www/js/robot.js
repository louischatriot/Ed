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


/**
 * Robot (can be player or an ennemy)
 */
function Robot(tile, level, speed, isEnnemy) {
  this.level = level; // The level the Robot is currently playing in
  this.x = tile.center().x;
  this.y = tile.center().y;
  this.direction = Robot.directions.RIGHT;

  this.kyu = 25; // How strong is this Robot?

	this.jumping = false;
  this.jumpingUp = true; // Each jump has two sequences. One up, one down.

  this.direction = this.nextDirection(); // 0 = right, 1 = up, 2 = left, 3 = down
	this.speed = speed;
	this.isEnnemy = isEnnemy;

  // Remember latest history. For the beginning we consider that we spent an eternity up to now on the start tile
  var nTilesToRemember = Math.floor(Robot.timeToRemember * this.speed) + 4;
  this.controlPoints = new CyclicArray(nTilesToRemember);
  for (var i = 0; i < nTilesToRemember; i += 1) { this.recordControlPoint({ center: tile.center() }); }
  this.listeners = {};

  this.alwaysTurnsRight = false; // enables maximal theoretical exploration
}

Robot.directions = { RIGHT: 0, UP: 1, LEFT: 2, DOWN: 3 }

// TODO: extenralize in config object
Robot.timeToRemember = 5000;   // In ms, how much history to remember for this robot


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
	this.x = tile.i + 1 / 2 ;
	this.y = tile.j + 1 / 2 ;
  this.jumping = false;
  this.jumpingUp = true;
  this.direction = Robot.directions.RIGHT;
  this.direction = this.nextDirection();
}


Robot.prototype.startAJump = function(tile) {
  this.jumping = true;
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

  if (this.jumping && tileWalls[this.direction] !== Tile.wallType.HARD) {
    return this.direction;
  }

  var plus = 0;
  if (this.alwaysTurnsRight) { plus = 1; }

  for (var i = dirSequence.indexOf(this.direction) + plus; i < dirSequence.length; i += 1) {
    if (tileWalls[dirSequence[i]] === Tile.wallType.NOWALL && getOppositeDirection(this.direction) !== dirSequence[i]) { return dirSequence[i]; }
  }

  return getOppositeDirection(this.direction);
}


/**
 * Update position
 * @param {Number} timeGap Number of milliseconds ellapsed since robot was last updated, can be negative to move backwards in time
 */
Robot.prototype.updatePosition = function (timeGap) {
  if (! this.isEnnemy && this.checkInterception()) { return this.hitEnnemy(); }

  var movement = timeGap * this.speed;
  if (movement === 0) { return; }

  if (movement < 0) {   // Going back in time
    movement = -movement;
    var controlPoint, movementToPerform, staleControlPoint;

    while (movement > 0) {
      // TODO: for now only center-type control points are used
      controlPoint = this.controlPoints.getLatest();
      staleControlPoint = this.movementTo(controlPoint.center) < movement;
      movementToPerform = Math.min(movement, this.movementTo(controlPoint.center));
      movement -= movementToPerform;
      this.move(movementToPerform, getOppositeDirection(controlPoint.direction));

      if (staleControlPoint) {
        this.controlPoints.staleLatest();
        this.direction = this.controlPoints.getLatest().direction;
      }
    }

  } else {   // Going forward in time
    var nextCenter, movementToPerform, registerCenter = false;

    while (movement > 0) {
      nextCenter = this.getNextCenter();
      registerCenter = this.movementTo(nextCenter) <= movement;
      movementToPerform = Math.min(movement, this.movementTo(nextCenter));
      movement -= movementToPerform;
      this.move(movementToPerform);

      if (registerCenter) {   // Just passed a center
        this.direction = this.nextDirection();
        this.recordControlPoint({ center: nextCenter });
        /*if (this.tile.isObjective) { // TODO: Robots don't have tiles anymore.
          //this.emit('won'); // TODO: currently doesn't seem to work.
          this.level.nextDifficulty(); // won't need this once emit works.
        }*/

        this.emit('justPassedIntersection'); //send event for AI.
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
 * Record a new control point (a tile center, a death etc.)
 */
Robot.prototype.recordControlPoint = function (payload) {
  if (payload.center) {   // Recording a center
    this.controlPoints.push({ center: payload.center, direction: this.direction });
    return;
  }
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


/**
 * Record a new control point (a tile center, a death etc.)
 */
Robot.prototype.recordControlPoint = function (payload) {
  if (payload.center) {   // Recording a center
    this.controlPoints.push({ center: payload.center, direction: this.direction });
    return;
  }
};
