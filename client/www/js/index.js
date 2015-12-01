// Create the canvas
var canvas = document.createElement("canvas");
canvas.style.border = "none";
var cxt = canvas.getContext("2d");

canvas.width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
canvas.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);


document.body.appendChild(canvas);

var tileSize=30;

if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) {
  //if user is playing from an iphone. The phone tends to zoom out. This is one dirty fix. Maybe there is another way?
	tileSize=60;
	lineWidth=5;
}

var tileTableWidth=Math.floor(canvas.width/tileSize); //size of the level
var tileTableHeight=Math.floor(canvas.height/tileSize); //size of the level

var screenTableHeight=Math.floor(canvas.height/tileSize);
var screenTableWidth=Math.floor(canvas.width/tileSize);



var theLevel=new Level(tileSize,tileTableWidth,tileTableHeight);
theLevel.createNewLevel();
theLevel.addANewPlayer();
//console.log(theLevel.tileTable);

var mDown=false; //is the user currently clicking

var main = function () {
	theLevel.update();
};


setInterval(main, 20);
