function AI(level,robot) {
  this.futureEnnemyPositions = new Array();
  this.ennemyClones = new Array();
  this.level = level;
  this.robot = robot; // The Robot controlled by the AI. Eventually this could be an array of robots
  this.canAIJumpTwiceInARow = false; // It's a bit too easy for the AI to keep continuously jumping. TODO: the parameter doesn't seem to change AI behavior
  this.AIDepth = 20; // the higher the depth, the better the AI, the slower the calculation. TODO: the depth is the number of tiles visited. It should really be the depth of the recursion, but this produces bad results. I'm not sure why
}


AI.prototype.on = function(evt, listener) {
  if (!this.listeners[evt]) { this.listeners[evt] = []; }
  this.listeners[evt].push(listener);
};


AI.prototype.emit = function (evt, message) {
  if (this.listeners[evt]) {
    this.listeners[evt].forEach(function (fn) { fn(message); });
  }
};


//on event
AI.prototype.makeDecisionOnNextJump = function() {
  // Robot just passed by an intersection. Times to make a decision about the next jump
  if ((!this.canAIJumpTwiceInARow && this.robot.jumping) || !faceWallType(nextTile(this.robot.tile,this.robot.direction), this.robot.direction, Tile.wallType.SOFT)) {
    return; // no need to calculate anything. Jumping is pointless
  }
  // first we create the table of future ennemy positions
  this.ennemyClones = new Array(); // eventually it would be better to keep the table stored from one step to the next
  this.updateFutureEnnemyPositions(1 / this.robot.speed , this.AIDepth); // TODO this shouldn't need to be recalculated every time. It's always the same table that just shifts by one every step. Est : 15min
  var next = this.AINext(nextTile(this.robot.tile,this.robot.direction),this.robot.direction,this.AIDepth,0,this.robot.jumping);
  if (next.jump) { this.robot.startJump(); }
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
AI.prototype.futureCollision = function(tile, direction, distance) {
  var futureEnnemyTable = this.futureEnnemyPositions[distance];
  var l = futureEnnemyTable.length;
  var safeDistance = 4 / 5;
  for (var i = 0; i < l; i++) {
      var e = futureEnnemyTable[i];
      if (e.tile.type === tile.type && Math.abs(tile.x - e.x) < safeDistance && Math.abs(tile.y - e.y) < safeDistance) {
        //condition for a collision to happen. Now we check in detail. First we create objects based there. Then we make them move.
        var ghostPlayer = new Robot(tile, this.level, this.level.playerSpeed, false);
        ghostPlayer.direction = nextDirection(tile,direction,false);;

        var ghostEnnemy = new Robot(e.tile, this.level, this.level.ennemySpeed, true);
        ghostEnnemy.x = e.x;
        ghostEnnemy.y = e.y;
        ghostEnnemy.direction = e.direction;
        ghostEnnemy.distanceToNextTile = e.distanceToNextTile;
        var timeStep = 30;
        var totalTime = 1 / this.level.playerSpeed;
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



// same function as Robot.prototype.nextDirection, except it doesn't have to be called on an object, which is convenient to avoid creating too many objects in AI depth
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


// Objectless copy of the same function as Robot.prototype.nextTile
function nextTile(tile,direction) {
  var i = tile.i;
  var j = tile.j;
  if (direction == Robot.directions.RIGHT && i < this.level.tileTableWidth - 1) { return this.level.tileTable[i + 1][j]; }
  if (direction == Robot.directions.LEFT && i > 0) { return this.level.tileTable[i - 1][j]; }
  if (direction == Robot.directions.UP && j > 0) { return this.level.tileTable[i][j - 1]; }
  if (direction == Robot.directions.DOWN && j < this.level.tileTableHeight - 1) { return this.level.tileTable[i][j + 1]; }

  // No tile found, return null
  return null;
}


/**
 * Returns wether the robot should be jumping or not, and the AI score.
 * Called either at every loop, or whenever the robot is faced with a decision
 * TODO AI never intentionally dies. Sometimes it can make things quicker in the beginning. Would need to keep calculating even after deaths. Est: 3h (need to redo everything)
 */
AI.prototype.AINext = function(tile,direction,depth,distance,justJumped) {
  if (tile.i === this.level.tileTableWidth-1 && tile.j === this.level.tileTableHeight-1) {
    return { jump: false, score: 10000/distance }; // reward the victory with the minimal distance spent to get there.
  }
  if (depth === 0) { return { jump: false, score: (tile.i+tile.j)/distance} } // reward going as far as possible from the origin in the minimum distance
  if (this.futureCollision(tile, direction, distance)) { return { jump: false, score: 0 }; } // Potential for ennemy collision in the future. This was a bad path

  if ((!this.canAIJumpTwiceInARow && justJumped) || !faceWallType(tile, direction, Tile.wallType.SOFT)) {
    //no point in jumping. No decision to make
    direction = nextDirection(tile,direction,false);
    tile = nextTile(tile,direction);
    return { jump: false, score: this.AINext(tile, direction, depth - 1 , distance + 1, false).score };
  }
  else {
      var resultWithJump = this.AINext(nextTile(tile,direction), direction, depth - 1, distance + 1, true);
      direction = nextDirection(tile,direction,false);
      tile = nextTile(tile,direction);
      var resultWithoutJump = this.AINext(tile, direction, depth - 1, distance + 1, false);
      if (resultWithJump.score > resultWithoutJump.score) { return { jump: true, score: resultWithJump.score }; }
      else { return { jump: false, score: resultWithoutJump.score }; } //don't jump
  }
}


AI.prototype.cloneEnnemies = function() {
  this.ennemyClones = new Array();
  for (var i = 0; i < this.level.ennemyTable.length; i++) {
    var newEnnemy = new Robot(this.level.ennemyTable[i].tile, this.level, this.level.ennemyTable[i].speed, true);
    newEnnemy.cloneFrom(this.level.ennemyTable[i]);
    this.ennemyClones.push(newEnnemy);
  }
}


//Push the future ennemy position by depth steps
AI.prototype.updateFutureEnnemyPositions = function(stepTimeGap,depth) {
  if (this.ennemyClones.length === 0) {
    this.cloneEnnemies();
    this.futureEnnemyPositions = new Array();
  }
  for (var j = 0; j < depth; j++) {
    var newStep = new Array();
    // move the cloned ennemies by one step;
    for (var i = 0; i < this.ennemyClones.length; i++) {
      this.ennemyClones[i].updatePosition(stepTimeGap);
      //TODO: we might as well make a full clone. Just saving a little bit of memory at this point
      newStep.push({ x: this.ennemyClones[i].x, y: this.ennemyClones[i].y, tile: this.ennemyClones[i].tile, direction: this.ennemyClones[i].direction, distanceToNextTile: this.ennemyClones[i].distanceToNextTile });
    }
    this.futureEnnemyPositions.push(newStep);
  }
}
