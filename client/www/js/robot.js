function Robot(tile, level, speed, isEnnemy) {
  this.level = level; // The level the Robot is currently playing in
  this.x = tile.x;
  this.y = tile.y;
  this.direction = Robot.directions.RIGHT;

	this.jumping = false;
  this.jumpingUp = true; // Each jump has two sequences. One up, one down.

  this.direction = this.nextDirection(); // 0 = right, 1 = up, 2 = left, 3 = down
	this.speed = speed;
	this.isEnnemy = isEnnemy;

  this.tilesToRemember = Math.floor(Robot.timeToRemember * this.speed) + 1;

  this.listeners = {};
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
  var tile = _tile || this.getCurrentTile()
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
  this.reposition(this.level.tileTable[0][0]);
}


/**
 * Get the next direction the robot can go to. Try first to keep the same direction (if no wall ahead or jumping)
 * Then try clockwise starting from the right of the current direction while avoiding to go in the opposite direction
 * If forced, go back the opposite direction
 */
Robot.prototype.nextDirection = function() {
  var dirSequence = [Robot.directions.UP, Robot.directions.RIGHT, Robot.directions.DOWN, Robot.directions.LEFT, Robot.directions.UP, Robot.directions.RIGHT, Robot.directions.DOWN, Robot.directions.LEFT]
    , tileWalls = {};

  //console.log("=============================");
  //console.log(this);
  //console.log(this.level.tileTable[Math.floor(this.x)][Math.floor(this.y)]);

  // TODO: this is of course not satisfying, we should use the same structure for indexing tile walls
  tileWalls[Robot.directions.UP] = this.getCurrentTile().upWall;
  tileWalls[Robot.directions.RIGHT] = this.getCurrentTile().rightWall;
  tileWalls[Robot.directions.DOWN] = this.getCurrentTile().downWall;
  tileWalls[Robot.directions.LEFT] = this.getCurrentTile().leftWall;

  if (this.jumping && tileWalls[this.direction] !== Tile.wallType.HARD) {
    return this.direction;
  }

  for (var i = dirSequence.indexOf(this.direction); i < dirSequence.length; i += 1) {
    if (tileWalls[dirSequence[i]] === Tile.wallType.NOWALL && getOppositeDirection(this.direction) !== dirSequence[i]) { return dirSequence[i]; }
  }

  return getOppositeDirection(this.direction);
}


/**
 * Update position
 * @param {Number} timeGap Number of milliseconds ellapsed since robot was last updated
 */
Robot.prototype.updatePosition = function(timeGap) {
  if (! this.isEnnemy && this.checkInterception()) { return this.hitEnnemy(); }

  var movement = timeGap * this.speed;

  // Finish movement on current tile
  var movementOnCurrentTile = Math.min(movement, this.getMovementLeftOnTile());
  if (this.direction === Robot.directions.RIGHT) { this.x += movementOnCurrentTile; }
  if (this.direction === Robot.directions.UP) { this.y -= movementOnCurrentTile; }
  if (this.direction === Robot.directions.LEFT) { this.x -= movementOnCurrentTile; }
  if (this.direction === Robot.directions.DOWN) { this.y += movementOnCurrentTile; }
  movement -= movementOnCurrentTile;

  // Move all the complete tiles possible
  var next;
  while (Math.floor(movement) > 0) {
    movement -= 1;
    this.direction = this.nextDirection();
    next = this.nextTile();
    this.x = next.x;
    this.y = next.y;
  }

  if (movement > 0) {
    this.direction = this.nextDirection();
  }

  // Move on the last tile
  if (this.direction === Robot.directions.RIGHT) { this.x += movement; }
  if (this.direction === Robot.directions.UP) { this.y -= movement; }
  if (this.direction === Robot.directions.LEFT) { this.x -= movement; }
  if (this.direction === Robot.directions.DOWN) { this.y += movement; }
}


/**
 * Get how much movement can still be made before being on the next tile (understood as being on or after the 0.5; 0.5 point)
 */
Robot.prototype.getMovementLeftOnTile = function () {
  var position, sign;
  if (this.direction === Robot.directions.RIGHT) { position = this.x; sign = 1; }
  if (this.direction === Robot.directions.UP) { position = this.y; sign = -1; }
  if (this.direction === Robot.directions.LEFT) { position = this.x; sign = -1; }
  if (this.direction === Robot.directions.DOWN) { position = this.y; sign = 1; }

  if (Math.floor(position - 1 / 2) === position - 1 / 2) {
    return 0;
  } else {
    return Math.abs(Math.floor(position - (sign / 2)) - position + 1 / 2 + sign);
  }
};


/**
 * Get current tile (strictly speaking, between the 0;0 and 1;1 points
 * Return null if out of tile table
 */
Robot.prototype.getCurrentTile = function () {
  if (this.level.tileTable[Math.floor(this.x)] && this.level.tileTable[Math.floor(this.x)][Math.floor(this.y)]) {
    return this.level.tileTable[Math.floor(this.x)][Math.floor(this.y)];
  } else {
    return null;
  }
};

