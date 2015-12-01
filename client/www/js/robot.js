

function Robot(currentTile,level,speed,isEnnemy) {
  this.level=level; //the level the Robot is currently playing in
  this.currentTile=currentTile;
  this.distanceToNextTile=level.tileSize; //The distance between the Robot and the next Tile. Decreases with time.
  this.x=currentTile.x;
  this.y=currentTile.y;
  this.direction=0; //0=right, 1=up, 2=left, 3=down

  this.radius=level.robotRadius;

	this.jumping=false;
	this.lastTime=Date.now();
	this.jumpingUp=true; //For the jumping sequence
	this.speed=speed; //Different robots may have different speeds

  this.speedRadiusIncrease=(level.maxJumpingRadius-this.radius)*2*this.speed/level.tileSize; //Speed at which the robot increases during a jump. Just an animation parameter

	this.color=level.robotColor;
	this.ennemy=isEnnemy; //Is it a player or an ennemy?

  this.AIControlled=false; //controlled by an AI?
  this.level.ennemyTable.push(this);
  //EventEmitter.call(this); //EventEmitter tutorial suggest to include this. I'm not sure why.
}

//Robot.prototype = new EventEmitter; //inherit from eventemitter class

Robot.prototype.draw=function() {
  //draw the given robot on the canvas
		cxt.beginPath();
		cxt.arc(this.x-this.level.cameraX,this.y-this.level.cameraY,this.radius,0,2*Math.PI);
		cxt.fillStyle = this.color;
		cxt.closePath();
		cxt.fill();
}

Robot.prototype.nextTile=function() {
  var i=this.currentTile.i;
  var j=this.currentTile.j;
  if (this.direction==0 && i<this.level.tileTableWidth-1) return this.level.tileTable[i+1][j];
  else if (this.direction==2 && i>0) return this.level.tileTable[i-1][j];
  else if (this.direction==1 && j>0) return this.level.tileTable[i][j-1];
  else if (this.direction==3 && j<this.level.tileTableHeight-1) return this.level.tileTable[i][j+1];
}


Robot.prototype.reposition=function(tile) {
  this.currentTile=tile;
	this.x=tile.i*level.tileSize+level.tileSize/2 ;
	this.y=tile.j*level.tileSize+level.tileSize/2 ;
	this.direction==0;
	this.distanceToNextTile=level.tileSize;
}

Robot.prototype.startAJump=function(tile) {
  this.jumping=true;
}


Robot.prototype.lost=function() {
  this.emit('dead'); //warn whoever is listening (at least the level that created the player) that the player just died.
}


var nextDirection=function(jumping,currentDirection,tile) {
  //Returns the next direction for a given intersection
  if (currentDirection == 0) {
      //going to the right
      if (jumping && tile.rightWall != 2) {
          return 0;
      }
      else {
          if (tile.downWall == 0) {
              return 3;
          }
          else if (tile.rightWall == 0) {
              return 0;
          }
          else if (tile.upWall == 0) {
              return 1;
          }
          else {
              return 2;
          }
      }
  }

  else if (currentDirection == 1) {
      //going up
      if (jumping && tile.upWall != 2) {
          return 1;
      }
      else {
          if (tile.rightWall == 0) {
              return 0;
          }
          else if (tile.upWall == 0) {
              return 1;
          }
          else if (tile.leftWall == 0) {
              return 2;
          }
          else {
              return 3;
          }
      }
  }
  else if (currentDirection == 2) {
      //going left
      if (jumping && tile.leftWall != 2) {
          return 2;
      }
      else {
          if (tile.upWall == 0) {
              return 1;
          }
          else if (tile.leftWall == 0) {
              return 2;
          }
          else if (tile.downWall == 0) {
              return 3;
          }
          else {
              return 0;
          }
      }
  }
  else if (currentDirection == 3) {
      //going down
      if (jumping && tile.downWall != 2) {
          return 3;
      }
      else {
          if (tile.leftWall == 0) {
              return 2;
          }
          else if (tile.downWall == 0) {
              return 3;
          }
          else if (tile.rightWall == 0) {
              return 0;
          }
          else {
              return 1;
          }
      }
  }
  return currentDirection;
}

Robot.prototype.updatePosition=function(timeGap) {
  //called at every loop. timeGap is the time since the Robot was last updated.
    if (this.jumping) {
      if (this.jumpingUp) {
        if (this.radius<this.maxJumpingRadius) this.radius=this.radius+(timeGap)*this.speedRadiusIncrease;
        else this.jumpingUp=false;
      }
      if (!this.jumpingUp){
        if (this.radius>level.robotRadius) this.radius=this.radius-(timeGap)*speedRadiusIncrease;
        else {
          this.radius=level.robotRadius;
          this.jumping=false;
          this.jumpingUp=true;
        }
      }
    }
    var s=this.currentTile;

    var movement=(timeGap)*this.speed;

    if (movement<this.distanceToNextTile) {
      //keep going in the same direction
      this.distanceToNextTile-=movement;
      if (this.direction==0) this.x+=movement;
      else if (this.direction==1) this.y-=movement;
      else if (this.direction==2) this.x-=movement;
      else if (this.direction==3) this.y+=movement;
    }
    else {
      //going by an intersection
      var next=this.nextTile();
      var newDirection=nextDirection(this.jumping,this.direction,next);
      console.log(newDirection);
      this.currentTile=next; //move to a new tile
      this.direction = newDirection;
      var movementLeft=movement-this.distanceToNextTile;
      this.distanceToNextTile=this.level.tileSize-movementLeft;
      if (this.direction==0) this.x=this.currentTile.x+movementLeft;
      else if (this.direction==1) this.y=this.currentTile.y-movementLeft;
      else if (this.direction==2) this.x=this.currentTile.x-movementLeft;
      else if (this.direction==3) this.y=this.currentTile.y+movementLeft;
    }
  }
