var renderer = new Renderer();

var level = new Level(renderer.tileSize, renderer.tileTableWidth, renderer.tileTableHeight);
level.createNewLevel();
level.addANewPlayer();
level.addANewPlayer();
level.playerTable[1].AIControlled = true;
level.addANewPlayer();
level.playerTable[2].AIControlled = true;
level.playerTable[2].AIDepth = 4;

level.on('positions.updated', function () { renderer.drawNewFrame(level); });



var startTouch = function(e) {
	e.preventDefault(); // preventing the touch from sliding the screen on mobile.
	level.startTouch();
}
var endTouch = function(e) {
	e.preventDefault();
	level.endTouch();
}

document.onkeydown = startTouch;
document.onkeyup = endTouch;

document.onmousedown = startTouch;
document.onmouseup = endTouch;

document.ontouchstart = startTouch;
document.ontouchend = endTouch;

var main = function () {
	level.update();
};

setInterval(main, 20);
