function Robot(currentTile, level, speed, isEnnemy) {
  this.level = level; // The level the Robot is currently playing in
  this.currentTile = currentTile;
  this.distanceToNextTile = level.tileSize; // The distance between the Robot and the next Tile. Decreases with time.
  this.x = currentTile.x;
  this.y = currentTile.y;
  this.direction = Robot.directions.RIGHT;

  this.radius = level.robotRadius;

	this.jumping = false;
  this.jumpingUp = true; // Each jump has two sequences. One up, one down.

  this.direction = this.nextDirection(); // 0 = right, 1 = up, 2 = left, 3 = down

	this.lastTime = Date.now();
	this.jumpingUp = true; // For the jumping sequence
	this.speed = speed; // Different robots may have different speeds

  this.speedRadiusIncrease = (this.level.maxJumpingRadius - this.radius) * 2 * this.speed / level.tileSize; // Speed at which the robot increases during a jump. Just an animation parameter

	this.color = level.robotColor;
  if (isEnnemy) { this.color = level.ennemyColor; }
	this.isEnnemy = isEnnemy;

  this.AIControlled = false;
}

Robot.directions = { RIGHT: 0, UP: 1, LEFT: 2, DOWN: 3 }

function getOppositeDirection (direction) {
  if (direction === Robot.directions.UP) { return Robot.directions.DOWN; }
  if (direction === Robot.directions.DOWN) { return Robot.directions.UP; }
  if (direction === Robot.directions.LEFT) { return Robot.directions.RIGHT; }
  if (direction === Robot.directions.RIGHT) { return Robot.directions.LEFT; }
}


Robot.prototype.draw = function() {
  cxt.beginPath();
  cxt.arc(this.x - this.level.cameraX, this.y - this.level.cameraY, this.radius, 0, 2 * Math.PI);
  cxt.fillStyle = this.color;
  cxt.closePath();
  cxt.fill();
}


Robot.prototype.nextTile = function() {
  var i = this.currentTile.i;
  var j = this.currentTile.j;
  if (this.direction == Robot.directions.RIGHT && i < this.level.tileTableWidth - 1) { return this.level.tileTable[i + 1][j]; }
  if (this.direction == Robot.directions.LEFT && i > 0) { return this.level.tileTable[i - 1][j]; }
  if (this.direction == Robot.directions.UP && j > 0) { return this.level.tileTable[i][j - 1]; }
  if (this.direction == Robot.directions.DOWN && j < this.level.tileTableHeight - 1) { return this.level.tileTable[i][j + 1]; }

  // No tile found, return null
  return null;
}


Robot.prototype.reposition = function(tile) {
  this.currentTile = tile;
	this.x = tile.i * this.level.tileSize + this.level.tileSize / 2 ;
	this.y = tile.j * this.level.tileSize + this.level.tileSize / 2 ;
	this.distanceToNextTile = this.level.tileSize;
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


Robot.prototype.checkInterception = function() {
  var e = this.level.ennemyTable;
  for (var i = 0; i < this.level.ennemyTable.length; i += 1) {
    if (this.distanceTo(this.level.ennemyTable[i]) < 4 * this.level.robotRadius * this.level.robotRadius) { return true; }
  }
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
  // TODO: this is of course not satisfying, we should use the same structure for indexing tile walls
  tileWalls[Robot.directions.UP] = this.currentTile.upWall;
  tileWalls[Robot.directions.RIGHT] = this.currentTile.rightWall;
  tileWalls[Robot.directions.DOWN] = this.currentTile.downWall;
  tileWalls[Robot.directions.LEFT] = this.currentTile.leftWall;

  if (this.jumping && tileWalls[this.direction] !== 2) { return this.direction; }

  for (var i = dirSequence.indexOf(this.direction) + 1; i < dirSequence.length; i += 1) {
    if (tileWalls[dirSequence[i]] === 0 && getOppositeDirection(this.direction) !== dirSequence[i]) { return dirSequence[i] }
  }

  return getOppositeDirection(this.direction);
}


/**
 * Update position and animate robot (name is probably not well chosen ...)
 * Called at every loop
 * @param {Number} timeGap Number of milliseconds elpased since robot was last updated
 */
Robot.prototype.updatePosition = function(timeGap) {
  if (!this.isEnnemy && this.checkInterception()) { return this.hitEnnemy(); }

  // Animate jump
  if (this.jumping) {
    if (this.jumpingUp) {
      if (this.radius < this.level.maxJumpingRadius) {
        this.radius += timeGap * this.speedRadiusIncrease;
      } else {
        this.jumpingUp = false;
      }
    } else {
      if (this.radius > this.level.robotRadius) {
        this.radius = this.radius - timeGap * this.speedRadiusIncrease;
      } else {
        this.radius = this.level.robotRadius;
        this.jumping = false;
        this.jumpingUp = true;
      }
    }
  }

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
      var index  =  this.currentTile.nearbyEnnemies.indexOf(this);
      if (index > -1) {
        this.currentTile.nearbyEnnemies.splice(index,1);
      }
    }

    this.currentTile = next;
    this.direction  =  this.nextDirection();
    var movementLeft = movement - this.distanceToNextTile;
    this.distanceToNextTile = this.level.tileSize - movementLeft;
    if (this.direction === Robot.directions.RIGHT) this.x = this.currentTile.x + movementLeft;
    if (this.direction === Robot.directions.UP) this.y = this.currentTile.y - movementLeft;
    if (this.direction === Robot.directions.LEFT) this.x = this.currentTile.x - movementLeft;
    if (this.direction === Robot.directions.DOWN) this.y = this.currentTile.y + movementLeft;
  }
}
