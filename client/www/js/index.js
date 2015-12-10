var canvas = document.createElement("canvas");
canvas.style.border = "none";
var cxt = canvas.getContext("2d"); // Need to turn that into a local variable

canvas.width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
canvas.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);


document.body.appendChild(canvas);

var tileSize = 30;
if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) {
  // if user is playing from an iphone. The phone tends to zoom out. This is one dirty fix. Maybe there is another way?
	tileSize = 60;
	lineWidth = 5;
}

var tileTableWidth = Math.floor(canvas.width / tileSize);
var tileTableHeight = Math.floor(canvas.height / tileSize);
var theLevel = new Level(tileSize,tileTableWidth,tileTableHeight);
theLevel.createNewLevel();
theLevel.addANewPlayer();
theLevel.addANewPlayer();
theLevel.playerTable[1].AIControlled = true;

var startTouch = function(e) {
	e.preventDefault(); // preventing the touch from sliding the screen on mobile.
	theLevel.startTouch();
}
var endTouch = function(e) {
	e.preventDefault();
	theLevel.endTouch();
}

document.onkeydown = startTouch;
document.onkeyup = endTouch;

document.onmousedown = startTouch;
document.onmouseup = endTouch;

document.ontouchstart = startTouch;
document.ontouchend = endTouch;

var main = function () {
	theLevel.update();
};

setInterval(main, 20);
