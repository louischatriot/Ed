// Create the canvas
var canvas = document.createElement("canvas");
canvas.style.border = "none";
var cxt = canvas.getContext("2d");

canvas.width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
canvas.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);


document.body.appendChild(canvas);
document.body.appendChild(canvas);

var tileSize=30;

if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) {
  //if user is playing from an iphone. The phone tends to zoom out. This is one dirty fix. Maybe there is another way?
	tileSize=60;
	lineWidth=5;
}

var tileTableWidth=Math.floor(canvas.width/tileSize); //size of the level
var tileTableHeight=Math.floor(canvas.height/tileSize); //size of the level

var screenTableHeight=Math.floor(canvas.height/cellSize);
var screenTableWidth=Math.floor(canvas.width/cellSize);

var cameraXInitial=-(canvas.width-tableWidth*cellSize)/2;
var cameraYInitial=-(canvas.height-tableHeight*cellSize)/2;
cameraXInitial=0;
cameraYInitial=0;

cameraX=cameraXInitial;
cameraY=cameraYInitial;


var robotSpeed=0.07*tileSize/30;
var ennemySpeed=0.02*tileSize/30;

var colorTable=["#ecf0f1","#1abc9c","#9b59b6","#e74c3c","#f1c40f","#95a5a6","#2c3e50"]; //mixed tones
colorTable=["#ecf0f1","#3498db","#2980b9","#16a085","#1abc9c","#27ae60","#2c3e50"]; //blue tones
colorTable=["#ecf0f1","#f1c40f","#e67e22","#d35400","#f39c12","#e74c3c","#2c3e50"]; //red tones
var ennemyColor="#7f8c8d";
var robotRadius=tileSize/2;
var robotSpeed=0;
var robotColor="#2c3e50";
var robotRadius=cellSize/5;
var maxJumpingRadius=robotRadius*1.3; //max of the Robot radius during a jump
var lineWidth=2; //The width of the walls to draw
var wallColor="#2c3e50";

var theLevel=new Level(tileSize,tileTableWidth,tileTableHeight,robotRadius);

var twoPlayers=false;


var mDown; //is the user currently clicking

var lastTime=Date.now(); //to actualize the game's graphics
var currentlyPlaying=true; //is the game paused or not?
