var robotRadius=10;
var robotSpeed=0;

function Robot(currentTile) {
  this.currentTile=currentTile;
  this.distanceToNextTile=tileSize; //The distance between the Robot and the next Tile. Decreases with time.
  this.direction=0; //0=right, 1=up, 2=left, 3=down

  this.radius=robotRadius;

	this.jumping=false;
	this.lastTime=Date.now();
	this.jumpingUp=true; //For the jumping sequence
	this.speed=robotSpeed; //Different robots may have different speeds
	this.color=ballColor;
	this.ennemy=false; //Is it a player or an ennemy?

  this.AIControlled=false; //controlled by an AI?

	this.amplitudeX=0; //to animate the character
	this.deltaAmplitudeX=2; //to animate the character

}

Robot.prototype.draw=function() {
		//draw the corresponding robot in the canvas
		if (this.directionX!=0 && !this.ennemy) {
			cxt.beginPath();
			cxt.arc(this.x+this.amplitudeX-cameraX,this.y-splitY-cameraY,radiusFeet,0,2*Math.PI);
			cxt.fillStyle = feetColor;
			cxt.closePath();
			cxt.fill();
			cxt.beginPath();
			cxt.arc(this.x-this.amplitudeX-cameraX,this.y+splitY-cameraY,radiusFeet,0,2*Math.PI);
			cxt.fillStyle = feetColor;
			cxt.closePath();
			cxt.fill();
		}
		else if (!this.ennemy) {
			cxt.beginPath();
			cxt.arc(this.x-splitY-cameraX,this.y+this.amplitudeX-cameraY,radiusFeet,0,2*Math.PI);
			cxt.fillStyle = feetColor;
			cxt.closePath();
			cxt.fill();
			cxt.beginPath();
			cxt.arc(this.x+splitY-cameraX,this.y-this.amplitudeX-cameraY,radiusFeet,0,2*Math.PI);
			cxt.fillStyle = feetColor;
			cxt.closePath();
			cxt.fill();
		}
		cxt.beginPath();
		cxt.arc(this.x-cameraX,this.y-cameraY,this.radius,0,2*Math.PI);
		cxt.fillStyle = this.color;
		cxt.closePath();
		cxt.fill();

}
