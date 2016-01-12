var renderer = new Renderer();

var currentKyu = 25;

var readyToPlay = false;
var inAGame = false;
var playerNumber; //an ID within the game for multiplayer game

if (localStorage.getItem('EdKyu')) {
	currentKyu = JSON.parse(localStorage.getItem('EdKyu'));
	currentKyu = 20;
}
else {
	localStorage.setItem( 'EdKyu', JSON.stringify(25)); // By default starts at 25 kyu
}

var socket = io('10.0.0.2:3000');
var thePlayerID = 0;
var pingPong = 0;
var lastPingSent = Date.now();

function pinging () {
	lastPingSent = Date.now();
	socket.emit('ping');
}

var pingIntervalID = setInterval(pinging, 1000);

socket.on('pong', function(msg){
	pingPong = Date.now() - lastPingSent;
});

socket.on('playerID', function(msg){
	thePlayerID = msg;
	var levelCreated = new Level({tileTableWidth: renderer.tileTableWidth, tileTableHeight: renderer.tileTableHeight});
	levelCreated.createNewLevel();
	readyToPlay = true;
	socket.emit('readyToPlay',{level: levelCreated.serialize() });
});

socket.on('startAJump', function(msg){
	console.log('startingAJump');
	var player = level.findPlayerFromPlayerID(msg.playerID);
	player.updatePosition(- msg.ping - pingPong / 2);
	player.startAJump();
	player.updatePosition(msg.ping + pingPong / 2)
	//pause();
	//level.update(- delay);
	//level.playerTable[1].startAJump();
	//level.update(delay);
	//start();
});

socket.on('endGame', function(msg){
	//need to interrupt the game here
});


var level = new Level();
level.on('positions.updated', function () { renderer.drawNewFrame(level); });
level.on('background.updated', function () { renderer.newBackground(); });
level.on('startAJump', function () {
	socket.emit('startAJump', { ping: pingPong / 2, playerID: level.playerTable[0].playerID });
});



socket.on('startGame', function(msg){
	level.deserialize(msg.level);
	level.addANewPlayer();
	console.log(msg.playerTable);
	console.log(msg.yourIndex);
	level.playerTable[0].playerID = msg.playerTable[msg.yourIndex];
	for (var i = 0; i < msg.playerTable.length; i++) {
		if (i !== msg.yourIndex) {
			level.addANewPlayer();
			level.playerTable[level.playerTable.length - 1].playerID = msg.playerTable[i];
		}
	}
	console.log(level.playerTable);
	inAGame = true;
	setTimeout(start, 1000 - pingPong/2);
});


function sendPositionUpdate () {
	socket.emit('positionUpdate', {playerPosition: level.playerTable[0].miniSerialize(), ping: pingPong/2, playerID: level.playerTable[0].playerID});
}


// TODO: we use the controlPoint array from the slave to update slave position, but it might be wrong.
// solution: during pings, record ennemy ping, master sends the future position of slave.
socket.on('positionUpdate', function(msg){
	var player = level.findPlayerFromPlayerID(msg.playerID);
	player.miniDeserialize(msg.playerPosition);
	player.updatePosition(msg.ping + pingPong / 2);
});


socket.on('tempo', function(msg){
	setTimeout(function(){
		level.adjustTempo();
	}, 1000 - pingPong/2);
});



//level.addANewPlayer();
//var theAI = new AI(level,level.playerTable[1]);



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

	//if (e.keyCode !== 32) { return }   // Uncomment to avoid noise during debugging
	e.preventDefault(); // preventing the touch from sliding the screen on mobile.
	level.startTouch();

	return;
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
	playing = true;
  lastTime = Date.now();
	level.update(0);
	positionUpdateIntervalId = setInterval(sendPositionUpdate, 500);
	//setInterval(tempoAdjust,1/level.playerTable[0].speed);
  intervalId = setInterval(main, 20);
}

function pause () {
	playing = false;
  clearInterval(intervalId);
  intervalId = undefined;
}
