var renderer = new Renderer();

var level = new Level(renderer.tileTableWidth, renderer.tileTableHeight);
level.createNewLevel();
p = level.addANewPlayer();

//level.addANewPlayer();
//var theAI = new AI(level,level.playerTable[1]);


// Remains to be seen: should we render a new frame every time the physics engine is updated?
level.on('positions.updated', function () { renderer.drawNewFrame(level); });

// Should this next line be in the AI constructor?
//level.playerTable[1].on('justPassedIntersection', function () { theAI.makeDecisionOnNextJump(); });



var startTouch = function(e) {
  // If F5 or i is pressed, trigger default action (reload page or launch dev tools)
  if (e.keyCode && (e.keyCode === 116 || e.keyCode === 73)) { return; }

  // Start/pause
  if (e.keyCode === 27) {
    if (intervalId !== undefined) { pause(); } else { start(); }
    return;
  }

  // Go back in time
  if (e.keyCode === 13) {
    timeDirection *= -1;
    return;
  }

  // Increase/decrease speed
  if (e.keyCode === 38) {
    speedBoost *= 1.1;
    return;
  }
  if (e.keyCode === 40) {
    speedBoost /= 1.1;
    return;
  }

  if (e.keyCode !== 32) { return }   // Uncomment to avoid noise during debugging
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
var lastTime
  , intervalId = undefined
  , timeDirection = 1
  , speedBoost = 1
  ;

function main () {
  var newTime = Date.now();
  var timeGap = (newTime - lastTime);
  lastTime = newTime;
	level.update(speedBoost * timeDirection * timeGap);
}

function start () {
  lastTime = Date.now();
  intervalId = setInterval(main, 20);
}

function pause () {
  clearInterval(intervalId);
  intervalId = undefined;
}



//setInterval(main, 20);
level.update(0);
