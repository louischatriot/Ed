
var colorTable=["#ecf0f1","#1abc9c","#9b59b6","#e74c3c","#f1c40f","#95a5a6","#2c3e50"]; //mixed tones
colorTable=["#ecf0f1","#3498db","#2980b9","#16a085","#1abc9c","#27ae60","#2c3e50"]; //blue tones
colorTable=["#ecf0f1","#f1c40f","#e67e22","#d35400","#f39c12","#e74c3c","#2c3e50"]; //red tones


function Tile(i,j,k,type,level) {
	this.level=level;
	this.i=i; //position in the squareArray
	this.j=j; //position in the squareArray
	this.x=level.tileSize*i+level.tileSize/2;
	this.y=level.tileSize*j+level.tileSize/2;
  this.k=k; //vertical position in the squareArray, in case there are multiple levels.
	this.type=type; //0 means is hasn't been filled by a corridor yet. All tiles in the same corridor have the same type
  this.toDraw=true; //Should the Tile be drawn?
	this.color=colorTable[type];
	this.upWall=1; //0=no wall, 1=soft wall, 2=hard wall, Cannot jump above hard walls
	this.rightWall=1;
	this.leftWall=1;
	this.downWall=1;
}

Tile.prototype.newType=function(type) {
	this.type=type;
	this.color=colorTable[type];
}

Tile.prototype.draw = function() {
  //draw the given Tile
  if (this.toDraw) {
    //First draw the square itself
    cxt.fillStyle=this.color;
    cxt.fillRect(this.i*this.level.tileSize-this.level.cameraX,this.j*this.level.tileSize-this.level.cameraY,this.level.tileSize,this.level.tileSize);

    //Next draw the walls
    cxt.strokeStyle=this.level.wallColor;
    //cxt.strokeStyle="#FF7F50";
    if (this.upWall!=0) {
      cxt.lineWidth=this.level.lineWidth;
      if (this.upWall==2) cxt.lineWidth=3*this.level.lineWidth;
      cxt.beginPath();
      cxt.moveTo(this.i*this.level.tileSize-this.level.cameraX,this.j*this.level.tileSize-this.level.cameraY);
      cxt.lineTo((this.i+1)*this.level.tileSize-this.level.cameraX,this.j*this.level.tileSize-this.level.cameraY); //should handle the starting issues.
      cxt.stroke();
    }
    if (this.downWall!=0) {
      cxt.lineWidth=this.level.lineWidth;
      if (this.downWall==2) cxt.lineWidth=3*this.level.lineWidth;
      cxt.beginPath();
      cxt.moveTo(this.i*this.level.tileSize-this.level.cameraX,(this.j+1)*this.level.tileSize-this.level.cameraY);
      cxt.lineTo((this.i+1)*this.level.tileSize-this.level.cameraX,(this.j+1)*this.level.tileSize-this.level.cameraY); //should handle the starting issues.
      cxt.stroke();
    }
    if (this.rightWall!=0) {
      cxt.lineWidth=this.level.lineWidth;
      if (this.rightWall==2) cxt.lineWidth=3*this.level.lineWidth;
      cxt.beginPath();
      cxt.moveTo((this.i+1)*this.level.tileSize-this.level.cameraX,this.j*this.level.tileSize-this.level.cameraY);
      cxt.lineTo((this.i+1)*this.level.tileSize-this.level.cameraX,(this.j+1)*this.level.tileSize-this.level.cameraY); //should handle the starting issues.
      cxt.stroke();
    }
    if (this.leftWall!=0) {
      cxt.lineWidth=this.level.lineWidth;
      if (this.leftWall==2) cxt.lineWidth=3*this.level.lineWidth;
      cxt.beginPath();
      cxt.moveTo(this.i*this.level.tileSize-this.level.cameraX,this.j*this.level.tileSize-this.level.cameraY);
      cxt.lineTo(this.i*this.level.tileSize-this.level.cameraX,(this.j+1)*this.level.tileSize-this.level.cameraY); //should handle the starting issues.
      cxt.stroke();
    }

  }
}
