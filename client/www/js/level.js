function Level(tileTableWidth, tileTableHeight) {
  this.tileTableHeight = tileTableHeight;
  this.tileTableWidth = tileTableWidth;
  this.tileTable = new Array();
  this.playerTable = new Array();
  this.ennemyTable = new Array();
  this.ennemySpeed = 0.02 / 30;
  this.playerSpeed = 0.06 / 30;
  this.readyToJump = true;   // To prevent a keydown from continually making a player jump
  this.currentlyPlaying = true;   // Use to pause the game

  this.ennemyDifficulty = 0.2;   // Higher means more ennemies will appear. Harder. Standard=0.1
  this.maxEnnemyPerRow = 2;   // Number of ennemies per corridors. Higher is harder. standard=2
  this.lengthDifficulty = 0.05;   // Higher means shorter corridors. Harder. standard= 0.05
  this.switchDifficulty = 0.4;   // Higher means more tortuous corridors. Easier. standard=0.4


  this.listeners = {};
}

// TODO: externalize in a config object
Level.maxTimeGapStep = 20;   // In ms, the maximum time gap with which level.update can ba called.
                             // If higher, the gap is broken down in smaller steps to avoid bad robot positioning
                             // A continuous approach would be better but much harder to implement IMO


Level.prototype.on = function(evt, listener) {
  if (!this.listeners[evt]) { this.listeners[evt] = []; }
  this.listeners[evt].push(listener);
};


Level.prototype.emit = function (evt, message) {
  if (this.listeners[evt]) {
    this.listeners[evt].forEach(function (fn) { fn(message); });
  }
};


Level.prototype.startTouch = function() {
  if (this.readyToJump) {
    this.playerTable[0].startAJump();
    this.readyToJump = false;
  }
}


Level.prototype.endTouch = function() {
  this.readyToJump = true;
}


Level.prototype.addANewPlayer = function() {
  var newPlayer = new Robot(this.tileTable[0][0],this,this.playerSpeed,false); // creates a new player on the origin tile
  if (this.tileTable[0][0].rightWall === 1) { newPlayer.direction = 3;} //could be done more elegantly. A bit of a hack
  this.playerTable.push(newPlayer);
  return newPlayer;
}


Level.prototype.reset = function() {
  this.tileTable = new Array();
	for (var i = 0; i < this.tileTableWidth; i++) {
		this.tileTable[i]=new Array();
		for (var j = 0; j < this.tileTableHeight; j++) {
			this.tileTable[i][j] = new Tile(i,j,0,this);
			if (i === 0) { this.tileTable[i][j].leftWall = Tile.wallType.HARD; }
			if (i === this.tileTableWidth-1) { this.tileTable[i][j].rightWall = Tile.wallType.HARD; }
			if (j === 0) { this.tileTable[i][j].upWall = Tile.wallType.HARD; }
			if (j === this.tileTableHeight-1) { this.tileTable[i][j].downWall = Tile.wallType.HARD; }
		}
	}
	ennemyTable=new Array();
}


Level.prototype.createNewLevel = function() {
  this.reset();
	for (var i = 0; i < this.tileTableWidth; i++) {
		for (var j = 0; j < this.tileTableHeight; j++) {
			var XX=0;
			var YY=0;
      // first need to decide the direction in which this corridor will start, then we create a new corridor.
			var rand=Math.random();
			if (rand<0.25) { XX = 1; }
			else if (rand<0.5) { XX = -1; }
			else if (rand<0.75) { YY = 1; }
			else YY = -1;
			var ennemyLeft = this.maxEnnemyPerRow;
			if (i === 0 && j === 0) ennemyLeft=0; // Makes sure you don't meet an ennemy in the very first path
			this.createPath(this.tileTable[i][j], this.lengthDifficulty, this.switchDifficulty, this.ennemyDifficulty, 1, 0, Math.floor(Math.random()*4)+2, 0, ennemyLeft);
		}
	}
  this.makeSingleTilesInaccessible();
}

Level.prototype.makeSingleTilesInaccessible = function() {
  for (var i = 0; i < this.tileTableWidth; i++) {
    for (var j = 0; j < this.tileTableHeight; j++) {
      var t = this.tileTable[i][j];
      if (t.upWall !== Tile.wallType.NOWALL && t.rightWall !== Tile.wallType.NOWALL && t.downWall !== Tile.wallType.NOWALL && t.leftWall !== Tile.wallType.NOWALL) {
        //It is a corridor made of a single tile
        t.upWall = Tile.wallType.HARD;
        t.downWall = Tile.wallType.HARD;
        t.leftWall = Tile.wallType.HARD;
        t.rightWall = Tile.wallType.HARD;
        t.newType(1);
        if (i > 0) { this.tileTable[i - 1][j].rightWall = Tile.wallType.HARD; }
        if (i < this.tileTableWidth - 1) { this.tileTable[i + 1][j].leftWall = Tile.wallType.HARD; }
        if (j > 0) { this.tileTable[i][j - 1].downWall = Tile.wallType.HARD; }
        if (j < this.tileTableHeight - 1) { this.tileTable[i][j+1].upWall = Tile.wallType.HARD; }

      }
    }
  }
}

/**
 * Recursive function used to create all the corridors in a new level
 * The code could probably be made shorter, but this works
 */
Level.prototype.createPath = function(startTile,lengthProba,switchbacksProba,ennemyProba,currentX,currentY,currentType,currentLength,maxNumberEnnemy) {
	if ( startTile.type !== 0) return; // Means you've ended on a tile that has already been filed up
	startTile.newType(currentType);
	var ennemyLeft = maxNumberEnnemy;

	if (Math.random() < ennemyProba && ennemyLeft > 0 && currentLength > 2) {
    //add an ennemy on this tile
		var ennemy = new Robot(startTile, this, this.ennemySpeed, true);
    this.ennemyTable.push(ennemy);
		ennemyLeft--;
	}

	var X = currentX; //current direction of the corridor being built
	var Y = currentY;
	var i = startTile.i;
	var j = startTile.j;
	var nextTile;

	if (Math.random() > lengthProba || currentLength < 2) {
		//we don't stop right there
		var switchback = false;
		if (Math.random() < switchbacksProba) switchback=true;
		if (X > 0 && (i >= this.tileTableWidth-1 || this.tileTable[i+1][j].type > 0 || switchback)) {
			//cannot move to the right as planned
				if (Math.random() > 0.5 && j < this.tileTableHeight-1 && this.tileTable[i][j+1].type === 0) {
					//move down
					X = 0;
					Y = 1;
				}
				else if (j > 0 && this.tileTable[i][j-1].type === 0) {
					//move up
					X = 0;
					Y = -1;
				}
				else if (j < this.tileTableHeight-1 && this.tileTable[i][j+1].type === 0) {
					//move down
					X = 0;
					Y = 1;
				}
				else {
					X = 0;
					Y = 0;
				}
		}
		else if (X < 0 && (i === 0 || this.tileTable[i-1][j].type > 0 || switchback)) {
			//cannot move to the left as planned
				if (Math.random() > 0.5 && j < this.tileTableHeight-1 && this.tileTable[i][j+1].type === 0) {
					//move down
					X = 0;
					Y = 1;
				}
				else if (j > 0 && this.tileTable[i][j-1].type === 0) {
					//move up
					X = 0;
					Y = -1;
				}
				else if (j < this.tileTableHeight-1 && this.tileTable[i][j+1].type === 0) {
					//move down
					X = 0;
					Y = 1;
				}
				else {
					X = 0;
					Y = 0;
				}
		}
		else if (Y > 0 && (j >= this.tileTableHeight-1 || this.tileTable[i][j+1].type > 0 || switchback)) {
			//cannot move down as planned
				if (Math.random() > 0.5 && i < this.tileTableWidth-1 && this.tileTable[i+1][j].type === 0) {
					//move right
					X = 1;
					Y = 0;
				}
				else if (i > 0 && this.tileTable[i-1][j].type === 0 ) {
					//move left
					X = -1;
					Y = 0;
				}
				else if (i < this.tileTableWidth-1 && this.tileTable[i+1][j].type === 0) {
					//move right
					X = 1;
					Y = 0;
				}
				else {
					X = 0;
					Y = 0;
				}
		}
		else if (Y < 0 && (j === 0 || this.tileTable[i][j-1].type > 0 || switchback)) {
			//cannot move up as planned
				if (Math.random() > 0.5 && i < this.tileTableWidth-1 && this.tileTable[i+1][j].type === 0) {
					//move right
					X = 1;
					Y = 0;
				}
				else if (i > 0 && this.tileTable[i-1][j].type === 0 ) {
					//move left
					X = -1;
					Y = 0;
				}
				if (i < this.tileTableWidth-1 && this.tileTable[i+1][j].type === 0) {
					//move right
					X = 1;
					Y = 0;
				}
				else {
					X = 0;
					Y = 0;
				}
		}
		nextTile = this.tileTable[i+X][j+Y];
		if (X > 0) {
			startTile.rightWall = Tile.wallType.NOWALL;
			nextTile.leftWall = Tile.wallType.NOWALL;
		}
		else if (X < 0) {
			startTile.leftWall = Tile.wallType.NOWALL;
			nextTile.rightWall = Tile.wallType.NOWALL;
		}
		else if (Y > 0) {
			startTile.downWall = Tile.wallType.NOWALL;
			nextTile.upWall = Tile.wallType.NOWALL;
		}
		else if (Y < 0) {
			startTile.upWall = Tile.wallType.NOWALL;
			nextTile.downWall = Tile.wallType.NOWALL;
		}
		if (X !== 0 || Y !== 0) this.createPath(nextTile,lengthProba,switchbacksProba,ennemyProba,X,Y,currentType,currentLength+1,ennemyLeft);
	}
}


/**
 * Move game forward by timeGap ms
 * @param {Number} timeGap How much to move time forward
 * @param {Boolean} dontUpdate Optional, if set to true don't update rest of the world (usually to avoid useless and time consuming redraws)
 */
Level.prototype.update = function(timeGap, dontUpdate) {
  if (timeGap > 1.01 * Level.maxTimeGapStep) {   // The 1.01 here is to avoid possible infinite recursion due to floating point math errors
    var fullSteps = Math.floor(timeGap / Level.maxTimeGapStep);
    timeGap -= fullSteps * Level.maxTimeGapStep;
    for (var i = 0; i < fullSteps; i += 1) {
      this.update(Level.maxTimeGapStep, true);
    }
    this.update(timeGap);
    return;
  }

  if (this.currentlyPlaying) {
    for (var i = 0; i < this.ennemyTable.length; i++) { this.ennemyTable[i].updatePosition(timeGap); }
    for (var i = 0; i < this.playerTable.length; i++) { this.playerTable[i].updatePosition(timeGap); }
    if (! dontUpdate) { this.emit('positions.updated'); }
  }
}
