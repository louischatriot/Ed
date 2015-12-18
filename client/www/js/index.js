var renderer = new Renderer();

var level = new Level(renderer.tileTableWidth, renderer.tileTableHeight);
level.createNewLevel();
level.addANewPlayer();

//level.addANewPlayer();
//var theAI = new AI(level,level.playerTable[1]);


// Remains to be seen: should we render a new frame every time the physics engine is updated?
level.on('positions.updated', function () { renderer.drawNewFrame(level); });

// Should this next line be in the AI constructor?
//level.playerTable[1].on('justPassedIntersection', function () { theAI.makeDecisionOnNextJump(); });



var startTouch = function(e) {
  // If F5 or i is pressed, trigger default action (reload page or launch dev tools)
  if (e.keyCode && (e.keyCode === 116 || e.keyCode === 73)) { return; }

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


/**
 * Main loop
 */
var lastTime = Date.now();

var main = function () {
  var newTime = Date.now();
  var timeGap = (newTime - lastTime);
  lastTime = newTime;

	level.update(timeGap);
};


setInterval(main, 800);
