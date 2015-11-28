// Create the canvas
var canvas = document.createElement("canvas");
canvas.style.border = "none";
var cxt = canvas.getContext("2d");

canvas.width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
canvas.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);


document.body.appendChild(canvas);
document.body.appendChild(canvas);


if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) {
	cellSize=60;
	lineWidth=5;
}

var tableWidth=Math.floor(canvas.width/cellSize);
var tableHeight=Math.floor(canvas.height/cellSize);

var screenTableHeight=Math.floor(canvas.height/cellSize);
var screenTableWidth=Math.floor(canvas.width/cellSize);

var cameraXInitial=-(canvas.width-tableWidth*cellSize)/2;
var cameraYInitial=-(canvas.height-tableHeight*cellSize)/2;
cameraXInitial=0;
cameraYInitial=0;

cameraX=cameraXInitial;
cameraY=cameraYInitial;


var robotSpeed=0.07*cellSize/30;
var ennemySpeed=0.02*cellSize/30;

var colorTable=["#ecf0f1","#1abc9c","#9b59b6","#e74c3c","#f1c40f","#95a5a6","#2c3e50"]; //mixed tones
colorTable=["#ecf0f1","#3498db","#2980b9","#16a085","#1abc9c","#27ae60","#2c3e50"]; //blue tones
colorTable=["#ecf0f1","#f1c40f","#e67e22","#d35400","#f39c12","#e74c3c","#2c3e50"]; //red tones


var mDown; //is the user currently clicking

var lastTime=Date.now(); //to actualize the game's graphics
