
var tileSize=30; //Will this global variable be known to other classes?
var lineWidth=2; //The width of the walls to draw
var wallColor; //color of the walls to draw

var colorTable=["#ecf0f1","#1abc9c","#9b59b6","#e74c3c","#f1c40f","#95a5a6","#2c3e50"]; //mixed tones
colorTable=["#ecf0f1","#3498db","#2980b9","#16a085","#1abc9c","#27ae60","#2c3e50"]; //blue tones
colorTable=["#ecf0f1","#f1c40f","#e67e22","#d35400","#f39c12","#e74c3c","#2c3e50"]; //red tones

var cameraXInitial=-(canvas.width-tableWidth*cellSize)/2;
var cameraYInitial=-(canvas.height-tableHeight*cellSize)/2;
cameraXInitial=0;
cameraYInitial=0;

cameraX=cameraXInitial;
cameraY=cameraYInitial;


function Tile(i,j,k,type) {
	this.i=i; //position in the squareArray
	this.j=j; //position in the squareArray
  this.k=k; //vertical position in the squareArray, in case there are multiple levels.
	this.type=type; //remembers the color? Could also be used for corridors
  this.toDraw=true; //Should the Tile be drawn?
	this.color=colorTable[type];
	this.upWall=0; //0=no wall, 1=soft wall, 2=hard wall, Cannot jump above hard walls
	this.rightWall=0;
	this.leftWall=0;
	this.downWall=0;
}

Tile.prototype.draw = function() {
  //draw the given Tile

  if (this.toDraw) {
    //First draw the square itself
    cxt.fillStyle=this.color;
    cxt.fillRect(this.i*cellSize-cameraX,this.j*cellSize-cameraY,cellSize,cellSize);

    //Next draw the walls
    cxt.strokeStyle=wallColor;
    //cxt.strokeStyle="#FF7F50";
    if (this.upWall!=0) {
      cxt.lineWidth=lineWidth;
      if (this.upWall==2) cxt.lineWidth=3*lineWidth;
      cxt.beginPath();
      cxt.moveTo(this.i*cellSize-cameraX,this.j*cellSize-cameraY);
      cxt.lineTo((this.i+1)*cellSize-cameraX,this.j*cellSize-cameraY); //should handle the starting issues.
      cxt.stroke();
    }
    if (this.downWall!=0) {
      cxt.lineWidth=lineWidth;
      if (this.downWall==2) cxt.lineWidth=3*lineWidth;
      cxt.beginPath();
      cxt.moveTo(this.i*cellSize-cameraX,(this.j+1)*cellSize-cameraY);
      cxt.lineTo((this.i+1)*cellSize-cameraX,(this.j+1)*cellSize-cameraY); //should handle the starting issues.
      cxt.stroke();
    }
    if (this.rightWall!=0) {
      cxt.lineWidth=lineWidth;
      if (this.rightWall==2) cxt.lineWidth=3*lineWidth;
      cxt.beginPath();
      cxt.moveTo((this.i+1)*cellSize-cameraX,this.j*cellSize-cameraY);
      cxt.lineTo((this.i+1)*cellSize-cameraX,(this.j+1)*cellSize-cameraY); //should handle the starting issues.
      cxt.stroke();
    }
    if (this.leftWall!=0) {
      cxt.lineWidth=lineWidth;
      if (this.leftWall==2) cxt.lineWidth=3*lineWidth;
      cxt.beginPath();
      cxt.moveTo(this.i*cellSize-cameraX,this.j*cellSize-cameraY);
      cxt.lineTo(this.i*cellSize-cameraX,(this.j+1)*cellSize-cameraY); //should handle the starting issues.
      cxt.stroke();
    }

  }
}

	this.newType=function(type) {
		this.type=type;
		this.color=colorTable[type];
	}
	//for (var prop in obj) this[prop] = obj[prop];
	this.draw=function() {

	}
}
