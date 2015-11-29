

function Robot(currentTile,level,speed) {
  this.level=level; //the level the Robot is currently playing in
  this.currentTile=currentTile;
  this.distanceToNextTile=level.tileSize; //The distance between the Robot and the next Tile. Decreases with time.
  this.x=currentTile.i*level.tileSize+level.tileSize/2;
  this.y=currentTile.j*level.tileSize+level.tileSize/2;
  this.direction=0; //0=right, 1=up, 2=left, 3=down

  this.radius=level.robotRadius;

	this.jumping=false;
	this.lastTime=Date.now();
	this.jumpingUp=true; //For the jumping sequence
	this.speed=speed; //Different robots may have different speeds

  this.speedRadiusIncrease=(level.maxJumpingRadius-this.radius)*2*this.speed/level.tileSize; //Speed at which the robot increases during a jump. Just an animation parameter

	this.color=robotColor;
	this.ennemy=false; //Is it a player or an ennemy?

  this.AIControlled=false; //controlled by an AI?
  EventEmitter.call(this); //EventEmitter tutorial suggest to include this. I'm not sure why.
}

Robot.prototype = new EventEmitter; //inherit from eventemitter class

Robot.prototype.draw=function() {
  //draw the given robot on the canvas
		cxt.beginPath();
		cxt.arc(this.x-cameraX,this.y-cameraY,this.radius,0,2*Math.PI);
		cxt.fillStyle = this.color;
		cxt.closePath();
		cxt.fill();
}

Robot.prototype.nextTile() {
  var i=currentTile.i;
  var j=currentTile.j;
  if (this.direction==0 && i<level.tileTableWidth-1) return level.tileTable[i+1][j];
  else if (this.direction==2 && i>0) return level.tileTable[i-1][j];
  else if (this.direction==1 && j<level.tileTableHeight-1) return level.tileTable[i][j+1];
  else if (this.direction==3 && j>0) return level.tileTable[i][j-1];
}


Robot.prototype.reposition=function(tile) {
  this.currentTile=tile;
	this.x=tile.i*level.tileSize+level.tileSize/2 ;
	this.y=tile.j*level.tileSize+level.tileSize/2 ;
	this.direction==0;
	this.distanceToNextTile=level.tileSize;
}


Robot.prototype.lost=function() {
  this.emit('dead'); //warn whoever is listening (at least the level that created the player) that the player just died.
}

Robot.prototype.updatePosition=function(timeGap) {
  //called at every loop. timeGap is the time since the Robot was last updated.
    var now=Date.now();

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

    if (movement<distanceToNextCenter) {
      //keep going in the same direction
      this.distanceToNextTile-=movement;
      if (direction==0) this.x+=movement;
      else if (direction==1) this.y+=movement;
      else if (direction==2) this.x-=movement;
      else if (direction==3) this.y-=movement;
    }
    else {
      //need to change direction

    }

    var newX=this.x+plusX;
    var newY=this.y+plusY;
    if (Math.abs(plusX)>this.distanceToNextCenter || Math.abs(plusY)>this.distanceToNextCenter) {
      this.x=s.i*cellSize+cellSize/2;
      this.y=s.j*cellSize+cellSize/2;
      this.distanceToNextCenter=cellSize;
      //Now figure out where the ball should go
      if (this.directionX>0 && s.rightWall) {
        if (s.downWall) {
          if (s.upWall) {
            this.directionX=-1;
          }
          else {
            this.directionX=0;
            this.directionY=-1;
          }
        }
        else {
          this.directionX=0;
          this.directionY=1;
        }
      }
      else if (this.directionX<0 && s.leftWall) {
        if (s.upWall) {
          if (s.downWall) {
            this.directionX=1;
          }
          else {
            this.directionX=0;
            this.directionY=1;
          }
        }
        else {
          this.directionX=0;
          this.directionY=-1;
        }
      }
      else if (this.directionY>0 && s.downWall) {
        if (s.leftWall) {
          if (s.rightWall) {
            this.directionY=-1;
          }
          else {
            this.directionX=1;
            this.directionY=0;
          }
        }
        else {
          this.directionX=-1;
          this.directionY=0;
        }
      }
      else if (this.directionY<0 && s.upWall) {
        if (s.rightWall) {
          if (s.leftWall) {
            this.directionY=1;
          }
          else {
            this.directionX=-1;
            this.directionY=0;
          }
        }
        else {
          this.directionX=1;
          this.directionY=0;
        }
      }

    }
    else {
      this.x=newX;
      this.y=newY;
      this.distanceToNextCenter=this.distanceToNextCenter-Math.abs(plusX)-Math.abs(plusY);
    }
    }
    this.lastTime=now;
  }
