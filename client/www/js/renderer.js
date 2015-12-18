/**
 * Renderer is responsible for displaying level and determining matrix size
 * Completely decoupled from game logic
 */
function Renderer () {
  this.$container = $('<div id="container"></div>');
  this.$container.css('position', 'fixed');
  this.$container.css('top', '0px');
  this.$container.css('left', '0px');
  this.$container.css('right', '0px');
  this.$container.css('bottom', '0px');

  this.$canvas = $('<canvas></canvas>')
  this.$canvas.css('position', 'absolute');
  this.$canvas.css('width', '100%');
  this.$canvas.css('height', '100%');
  this.$canvas.css('border', 'none');

  $('body').append(this.$container);
  $('#container').append(this.$canvas);

  this.canvas = this.$canvas.get()[0];
  this.canvas.width = this.$canvas.width();
  this.canvas.height = this.$canvas.height();
  this.ctx = this.canvas.getContext("2d");

  // Tiling
  this.tileSize = 30;
  if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) {
    // If user is playing from an iphone. The phone tends to zoom out. This is one dirty fix. Maybe there is another way?
    this.tileSize = 60;
    this.lineWidth = 5;
  }
  this.tileTableWidth = Math.floor(this.canvas.width / this.tileSize);
  this.tileTableHeight = Math.floor(this.canvas.height / this.tileSize);

  this.lineWidth = 2;
  this.hardWallMultiplier = 1;
  this.wallColor = "#2c3e50";
  this.hardWallColor = "#2c3e50"; //keep the same for now but this may change

  this.lastFrameDrawTime = Date.now();
}

Renderer.robotRadius = 1 / 5;   // As % of tile size
Renderer.robotMaxJumpingRadius = 1.3 * Renderer.robotRadius;
Renderer.ennemyColor = "#7f8c8d";
Renderer.robotColor = "#2c3e50";
//Renderer.tileColorTable = ["#ecf0f1","#3498db","#2980b9","#16a085","#1abc9c","#27ae60","#2c3e50"];   // Blue tones
//Renderer.tileColorTable = ["#ecf0f1","#f1c40f","#e67e22","#d35400","#f39c12","#e74c3c","#2c3e50"];   // Red tones
Renderer.tileColorTable = ["#ecf0f1","#7f8c8d","#1abc9c","#9b59b6","#e74c3c","#f1c40f","#2c3e50"];   // Mixed tones


/**
 * Put renderer state back to background only, no robots
 * Save background as an image the first time to avoid redrawing it every time, saving a lot of CPU
 */
Renderer.prototype.backToBackground = function (tileTable) {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height );

  if (!this.$backgroundImage) {
    for (var i = 0; i < this.tileTableWidth; i++) {
      for (var j = 0; j < this.tileTableHeight; j++) {
        this.drawTile(tileTable[i][j]);
      }
    }

    this.$backgroundImage = $('<img src="' + this.canvas.toDataURL("image/png") + '">');
    this.$backgroundImage.css('position', 'fixed');
    this.$backgroundImage.css('top', '0px');
    this.$backgroundImage.css('left', '0px');
    this.$backgroundImage.css('width', this.canvas.width + 'px');
    this.$backgroundImage.css('height', this.canvas.height + 'px');

    $('body').prepend(this.$backgroundImage);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height );
  }
};

//Draws a black frame around the maze. Purely esthetics. 
Renderer.prototype.drawSurrounding = function () {
  this.ctx.strokeStyle = this.hardWallColor;
  this.ctx.lineWidth = 3;
  this.ctx.beginPath();
  this.ctx.moveTo(0, 0);
  this.ctx.lineTo(this.tileTableWidth * this.tileSize, 0);
  this.ctx.lineTo(this.tileTableWidth * this.tileSize, this.tileTableHeight * this.tileSize);
  this.ctx.lineTo(0, this.tileTableHeight * this.tileSize);
  this.ctx.lineTo(0, 0);
  this.ctx.stroke();
}



/**
 * Draw a robot, can be the current player, opponents or ennemies
 * Removed mention of cameraX and cameraY, unused for now
 */
Renderer.prototype.drawRobot = function (robot, timeGap) {
  if (!robot.radius) { robot.radius = Renderer.robotRadius; }

  // Jump animation
  if (robot.jumping) {
    if (robot.jumpingUp) {
      if (robot.radius < Renderer.robotMaxJumpingRadius) {
        robot.radius += timeGap * (Renderer.robotMaxJumpingRadius - Renderer.robotRadius) * 2 * robot.speed;
      } else {
        robot.jumpingUp = false;
      }
    } else {
      if (robot.radius > Renderer.robotRadius) {
        robot.radius -= timeGap * (Renderer.robotMaxJumpingRadius - Renderer.robotRadius) * 2 * robot.speed;
      } else {
        robot.radius = Renderer.robotRadius;
        robot.jumping = false;
        robot.jumpingUp = true;
      }
    }
  }

  this.ctx.beginPath();
  this.ctx.arc(robot.x * this.tileSize, robot.y * this.tileSize, robot.radius * this.tileSize, 0, 2 * Math.PI);
  this.ctx.fillStyle = robot.isEnnemy ? Renderer.ennemyColor : Renderer.robotColor;
  this.ctx.closePath();
  this.ctx.fill();
};


/**
 * Draw a new frame
 */
Renderer.prototype.drawNewFrame = function (level) {
  var frameDrawTime = Date.now(), timeGap = frameDrawTime - this.lastFrameDrawTime;
  this.lastFrameDrawTime = frameDrawTime;

  renderer.backToBackground(level.tileTable);
  level.ennemyTable.forEach(function (robot) { renderer.drawRobot(robot, timeGap); });
  level.playerTable.forEach(function (robot) { renderer.drawRobot(robot, timeGap); });
  this.drawSurrounding();
};


/**
 * Draw a tile
 * As above removed all mentions of cameraX and cameraY for now
 */
Renderer.prototype.drawTile = function (tile) {
  // Draw the square itself
  this.ctx.fillStyle = Renderer.tileColorTable[tile.type];
  this.ctx.fillRect(tile.i * this.tileSize, tile.j * this.tileSize, this.tileSize, this.tileSize);

  // Draw the walls
  if (tile.upWall !== Tile.wallType.NOWALL) {
    this.ctx.strokeStyle = (tile.upWall === Tile.wallType.HARD ? this.hardWallColor : this.wallColor) ;
    this.ctx.lineWidth = this.lineWidth * (tile.upWall === Tile.wallType.HARD ? this.hardWallMultiplier : 1);
    this.ctx.beginPath();
    this.ctx.moveTo(tile.i * this.tileSize, tile.j * this.tileSize);
    this.ctx.lineTo((tile.i + 1) * this.tileSize, tile.j * this.tileSize);
    this.ctx.stroke();
  }
  if (tile.downWall !== Tile.wallType.NOWALL) {
    this.ctx.strokeStyle = (tile.downWall === Tile.wallType.HARD ? this.hardWallColor : this.wallColor) ;
    this.ctx.lineWidth = this.lineWidth * (tile.downWall === Tile.wallType.HARD ? this.hardWallMultiplier : 1);
    this.ctx.beginPath();
    this.ctx.moveTo(tile.i * this.tileSize, (tile.j + 1) * this.tileSize);
    this.ctx.lineTo((tile.i + 1) * this.tileSize, (tile.j + 1) * this.tileSize);
    this.ctx.stroke();
  }
  if (tile.leftWall !== Tile.wallType.NOWALL) {
    this.ctx.strokeStyle = (tile.leftWall === Tile.wallType.HARD ? this.hardWallColor : this.wallColor) ;
    this.ctx.lineWidth = this.lineWidth * (tile.leftWall === Tile.wallType.HARD ? this.hardWallMultiplier : 1);
    this.ctx.beginPath();
    this.ctx.moveTo(tile.i * this.tileSize, tile.j * this.tileSize);
    this.ctx.lineTo(tile.i * this.tileSize, (tile.j + 1) * this.tileSize);
    this.ctx.stroke();
  }
  if (tile.rightWall !== Tile.wallType.NOWALL) {
    this.ctx.strokeStyle = (tile.rightWall === Tile.wallType.HARD ? this.hardWallColor : this.wallColor) ;
    this.ctx.lineWidth = this.lineWidth * (tile.rightWall === Tile.wallType.HARD ? this.hardWallMultiplier : 1);
    this.ctx.beginPath();
    this.ctx.moveTo((tile.i + 1) * this.tileSize, tile.j * this.tileSize);
    this.ctx.lineTo((tile.i + 1) * this.tileSize, (tile.j + 1) * this.tileSize);
    this.ctx.stroke();
  }
};
