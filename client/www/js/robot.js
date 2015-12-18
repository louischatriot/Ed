function Robot(tile, level, speed, isEnnemy) {
  this.level = level; // The level the Robot is currently playing in
  this.tile = tile;
  this.distanceToNextTile = 1; // The distance between the Robot and the next Tile. Decreases with time.
  this.x = tile.x;
  this.y = tile.y;
  this.direction = Robot.directions.RIGHT;

	this.jumping = false;
  this.jumpingUp = true; // Each jump has two sequences. One up, one down.

  this.direction = this.nextDirection(); // 0 = right, 1 = up, 2 = left, 3 = down
	this.speed = speed;
	this.isEnnemy = isEnnemy;
  this.listeners = {};
}

Robot.directions = { RIGHT: 0, UP: 1, LEFT: 2, DOWN: 3 }


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
  this.tile = anotherRobot.tile;
  this.distanceToNextTile = anotherRobot.distanceToNextTile;
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


Robot.prototype.nextTile = function() {
  return nextTile(this.tile, this.direction);
}


Robot.prototype.reposition = function(tile) {
  this.tile = tile;
	this.x = tile.i + 1 / 2 ;
	this.y = tile.j + 1 / 2 ;
	this.distanceToNextTile = 1;
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
  tileWalls[Robot.directions.UP] = this.tile.upWall;
  tileWalls[Robot.directions.RIGHT] = this.tile.rightWall;
  tileWalls[Robot.directions.DOWN] = this.tile.downWall;
  tileWalls[Robot.directions.LEFT] = this.tile.leftWall;

  if (this.jumping && tileWalls[this.direction] !== Tile.wallType.HARD) {
    return this.direction;
  }

  for (var i = dirSequence.indexOf(this.direction); i < dirSequence.length; i += 1) {
    if (tileWalls[dirSequence[i]] === Tile.wallType.NOWALL && getOppositeDirection(this.direction) !== dirSequence[i]) { return dirSequence[i]; }
  }

  return getOppositeDirection(this.direction);
}


/**
 * Update position and animate robot (name is probably not well chosen ...)
 * Called at every loop
 * @param {Number} timeGap Number of milliseconds ellapsed since robot was last updated
 */
Robot.prototype.updatePosition = function(timeGap) {
  if (!this.isEnnemy && this.checkInterception()) { return this.hitEnnemy(); }

  var movement = timeGap * this.speed;
  if (movement < this.distanceToNextTile) {
    // Keep going in the same direction
    this.distanceToNextTile -= movement;
    if (this.direction === Robot.directions.RIGHT) this.x += movement;
    if (this.direction === Robot.directions.UP) this.y -= movement;
    if (this.direction === Robot.directions.LEFT) this.x -= movement;
    if (this.direction === Robot.directions.DOWN) this.y += movement;
  } else {
    // Going by an intersection
    var next = this.nextTile();

    if (this.isEnnemy) {
      next.nearbyEnnemies.push(this);
      var index  =  this.tile.nearbyEnnemies.indexOf(this);
      if (index > -1) {
        this.tile.nearbyEnnemies.splice(index,1);
      }
    }

    this.tile = next;
    this.direction  =  this.nextDirection();
    var movementLeft = movement - this.distanceToNextTile;
    this.distanceToNextTile = 1 - movementLeft;
    if (this.direction === Robot.directions.RIGHT) this.x = this.tile.x + movementLeft;
    if (this.direction === Robot.directions.UP) this.y = this.tile.y - movementLeft;
    if (this.direction === Robot.directions.LEFT) this.x = this.tile.x - movementLeft;
    if (this.direction === Robot.directions.DOWN) this.y = this.tile.y + movementLeft;

    this.emit('justPassedIntersection'); //send event for AI.
    }
}
