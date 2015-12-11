

var theLevel = new Level(tileSize,tileTableWidth,tileTableHeight);
theLevel.createNewLevel();
theLevel.addANewPlayer();
theLevel.addANewPlayer();
theLevel.playerTable[1].AIControlled = true;
theLevel.addANewPlayer();
theLevel.playerTable[2].AIControlled = true;
theLevel.playerTable[2].AIDepth = 4;

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
