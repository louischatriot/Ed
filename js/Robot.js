var robotRadius=tileSize/2;
var robotSpeed=0;
var robotColor="#2c3e50";
var robotRadius=cellSize/5;

var maxJumpingRadius=robotRadius*1.3; //max of the Robot radius during a jump
var speedRadiusIncrease=(maxJumpingRadius-robotRadius)*2*robotSpeed/cellSize; //Speed at which the robot increases during a jump. Just an animation parameter

function Robot(currentTile) {
  this.currentTile=currentTile;
  this.distanceToNextTile=tileSize; //The distance between the Robot and the next Tile. Decreases with time.
  this.x=currentTile.i*tileSize;
  this.y=currentTile.j*tileSize;
  this.direction=0; //0=right, 1=up, 2=left, 3=down

  this.radius=robotRadius;

	this.jumping=false;
	this.lastTime=Date.now();
	this.jumpingUp=true; //For the jumping sequence
	this.speed=robotSpeed; //Different robots may have different speeds
	this.color=robotColor;
	this.ennemy=false; //Is it a player or an ennemy?

  this.AIControlled=false; //controlled by an AI?
  EventEmitter.call(this);
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


Robot.prototype.lost=function() {
  this.emit('dead');
  this.reposition(squareTable[0][0]);
  cameraX=cameraXInitial;
  cameraY=cameraXInitial;
}
