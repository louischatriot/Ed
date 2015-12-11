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

	this.speed = speed; // Different robots may have different speeds

	this.color = level.robotColor;
  if (isEnnemy) { this.color = level.ennemyColor; }
	this.isEnnemy = isEnnemy;

  this.AIControlled = false; // Keep false for human players
  this.canAIJumpTwiceInARow = false; // It's a bit too easy for the AI to keep continuously jumping. TODO: the parameter doesn't seem to change AI behavior
  this.AIDepth = 20; // the higher the depth, the better the AI, the slower the calculation. TODO: the depth is the number of tiles visited. It should really be the depth of the recursion, but this produces bad results. I'm not sure why
}


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

Robot.directions = { RIGHT: 0, UP: 1, LEFT: 2, DOWN: 3 }

function getOppositeDirection (direction) {
  if (direction === Robot.directions.UP) { return Robot.directions.DOWN; }
  if (direction === Robot.directions.DOWN) { return Robot.directions.UP; }
  if (direction === Robot.directions.LEFT) { return Robot.directions.RIGHT; }
  if (direction === Robot.directions.RIGHT) { return Robot.directions.LEFT; }
}

function faceWallType(tile,direction,type) {
  if (direction === Robot.directions.RIGHT && tile.rightWall === type) { return true; }
  if (direction === Robot.directions.UP && tile.upWall === type) { return true; }
  if (direction === Robot.directions.LEFT && tile.leftWall === type) { return true; }
  if (direction === Robot.directions.DOWN && tile.downWall === type) { return true; }
  return false;
}


// checks wether the future ghost will touch future ennemies
// TODO: it seems that this function is not catching all collision. Sometimes the AI still inexplicably collides. est: 30min
function futureCollision(tile, direction, distance) {
  var futureEnnemyTable = tile.level.futureEnnemyPositions[distance];
  var l = futureEnnemyTable.length;
  var safeDistance = tile.level.robotRadius * 4;
  for (var i = 0; i < l; i++) {
      var e = futureEnnemyTable[i];
      if (e.tile.type === tile.type && Math.abs(tile.x - e.x) < safeDistance && Math.abs(tile.y - e.y) < safeDistance) {
        //condition for a collision to happen. Now we check in detail. First we create objects based there. Then we make them move.
        var ghostPlayer = new Robot(tile, tile.level, tile.level.playerSpeed, false);
        ghostPlayer.direction = nextDirection(tile,direction,false);;

        var ghostEnnemy = new Robot(e.tile, tile.level, tile.level.ennemySpeed, true);
        ghostEnnemy.x = e.x;
        ghostEnnemy.y = e.y;
        ghostEnnemy.direction = e.direction;
        ghostEnnemy.distanceToNextTile = e.distanceToNextTile;
        var timeStep = 30;
        var totalTime = 1 / tile.level.playerSpeed;
        var elapsedTime = 0;
        while (elapsedTime < totalTime) {
          elapsedTime += timeStep;
          ghostPlayer.updatePosition(timeStep);
          ghostEnnemy.updatePosition(timeStep);
          if (ghostPlayer.collisionWith(ghostEnnemy)) { return true; }
        }
      }
  }
  return false;
}


/**
 * Returns wether the robot should be jumping or not, and the AI score.
 * Called either at every loop, or whenever the robot is faced with a decision
 * TODO AI never intentionally dies. Sometimes it can make things quicker in the beginning. Would need to keep calculating even after deaths. Est: 3h (need to redo everything)
 */
function AINext(tile,direction,depth,distance,justJumped) {
  if (tile.i === tile.level.tileTableWidth-1 && tile.j === tile.level.tileTableHeight-1) {
    return { jump: false, score: 10000/distance }; // reward the victory with the minimal distance spent to get there.
  }
  if (depth === 0) { return { jump: false, score: (tile.i+tile.j)/distance} } // reward going as far as possible from the origin in the minimum distance
  if (futureCollision(tile, direction, distance)) { return { jump: false, score: 0 }; } // Potential for ennemy collision in the future. This was a bad path

  if ((!this.canAIJumpTwiceInARow && justJumped) || !faceWallType(tile, direction, Tile.wallType.SOFT)) {
    //no point in jumping. No decision to make
    direction = nextDirection(tile,direction,false);
    tile = nextTile(tile,direction);
    return { jump: false, score: AINext(tile, direction, depth - 1 , distance + 1, false).score };
  }
  else {
      var resultWithJump = AINext(nextTile(tile,direction), direction, depth - 1, distance + 1, true);
      direction = nextDirection(tile,direction,false);
      tile = nextTile(tile,direction);
      var resultWithoutJump = AINext(tile, direction, depth - 1, distance + 1, false);
      if (resultWithJump.score > resultWithoutJump.score) { return { jump: true, score: resultWithJump.score }; }
      else { return { jump: false, score: resultWithoutJump.score }; } //don't jump
  }
}


function nextTile(tile,direction) {
  var i = tile.i;
  var j = tile.j;
  if (direction == Robot.directions.RIGHT && i < tile.level.tileTableWidth - 1) { return tile.level.tileTable[i + 1][j]; }
  if (direction == Robot.directions.LEFT && i > 0) { return tile.level.tileTable[i - 1][j]; }
  if (direction == Robot.directions.UP && j > 0) { return tile.level.tileTable[i][j - 1]; }
  if (direction == Robot.directions.DOWN && j < tile.level.tileTableHeight - 1) { return tile.level.tileTable[i][j + 1]; }

  // No tile found, return null
  return null;
}


Robot.prototype.nextTile = function() {
  var i = this.tile.i;
  var j = this.tile.j;
  if (this.direction == Robot.directions.RIGHT && i < this.level.tileTableWidth - 1) { return this.level.tileTable[i + 1][j]; }
  if (this.direction == Robot.directions.LEFT && i > 0) { return this.level.tileTable[i - 1][j]; }
  if (this.direction == Robot.directions.UP && j > 0) { return this.level.tileTable[i][j - 1]; }
  if (this.direction == Robot.directions.DOWN && j < this.level.tileTableHeight - 1) { return this.level.tileTable[i][j + 1]; }

  // No tile found, return null
  return null;
}


Robot.prototype.reposition = function(tile) {
  this.tile = tile;
	this.x = tile.i + 1 / 2 ;
	this.y = tile.j + 1 / 2 ;
	this.distanceToNextTile = 1;
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
  var r = 2 * this.level.robotRadius;
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


// same function as the prototype nextDirection, except it doesn't have to be called on an object, which is convenient to avoid creating too many objects in AI depth
function nextDirection(tile,direction,jump) {
  var dirSequence = [Robot.directions.UP, Robot.directions.RIGHT, Robot.directions.DOWN, Robot.directions.LEFT, Robot.directions.UP, Robot.directions.RIGHT, Robot.directions.DOWN, Robot.directions.LEFT]
    , tileWalls = {};
  tileWalls[Robot.directions.UP] = tile.upWall;
  tileWalls[Robot.directions.RIGHT] = tile.rightWall;
  tileWalls[Robot.directions.DOWN] = tile.downWall;
  tileWalls[Robot.directions.LEFT] = tile.leftWall;

  if (jump && tileWalls[direction] !== Tile.wallType.HARDWALL) { return direction; }

  for (var i = dirSequence.indexOf(direction); i < dirSequence.length; i += 1) {
    if (tileWalls[dirSequence[i]] === 0 && getOppositeDirection(direction) !== dirSequence[i]) { return dirSequence[i]; }
  }

  return getOppositeDirection(direction);
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

  if (this.jumping && tileWalls[this.direction] !== Tile.wallType.HARD) { return this.direction; }

  for (var i = dirSequence.indexOf(this.direction); i < dirSequence.length; i += 1) {
    if (tileWalls[dirSequence[i]] === 0 && getOppositeDirection(this.direction) !== dirSequence[i]) { return dirSequence[i]; }
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

    if (this.AIControlled) {
      // You've just passed by an intersection. Times to make a decision about the next jump
      if ((!this.canAIJumpTwiceInARow && this.jumping) || !faceWallType(nextTile(this.tile,this.direction), this.direction, Tile.wallType.SOFT)) {
        return; // no need to calculate anything. Jumping is pointless
      }
      // first we create the table of future ennemy positions
      this.level.ennemyClones = new Array(); // eventually it would be better to keep the table stored from one step to the next
      this.level.updateFutureEnnemyPositions(1 / this.speed , this.AIDepth); // TODO this shouldn't need to be recalculated every time. It's always the same table that just shifts by one every step. Est : 15min
      var next = AINext(nextTile(this.tile,this.direction),this.direction,this.AIDepth,0,this.jumping);
      if (next.jump) { this.startAJump(); }
    }
  }
}
