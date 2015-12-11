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
  this.wallColor = "#2c3e50";
}


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


/**
 * Draw a robot, can be the current player, opponents or ennemies
 * Removed mention of cameraX and cameraY, unused for now
 */
Renderer.prototype.drawRobot = function (robot) {
  this.ctx.beginPath();
  this.ctx.arc(robot.x * this.tileSize, robot.y * this.tileSize, robot.radius * this.tileSize, 0, 2 * Math.PI);
  this.ctx.fillStyle = robot.color;
  this.ctx.closePath();
  this.ctx.fill();
};


/**
 * Draw a tile
 * As above removed all mentions of cameraX and cameraY for now
 */
Renderer.prototype.drawTile = function (tile) {
  // Draw the square itself
  this.ctx.fillStyle = tile.color;
  this.ctx.fillRect(tile.i * this.tileSize, tile.j * this.tileSize, this.tileSize, this.tileSize);

  // Draw the walls
  this.ctx.strokeStyle = this.wallColor;
  if (tile.upWall !== Tile.wallType.NOWALL) {
    this.ctx.lineWidth = this.lineWidth * (tile.upWall === Tile.wallType.HARD ? 3 : 1);
    this.ctx.beginPath();
    this.ctx.moveTo(tile.i * this.tileSize, tile.j * this.tileSize);
    this.ctx.lineTo((tile.i + 1) * this.tileSize, tile.j * this.tileSize);
    this.ctx.stroke();
  }
  if (tile.downWall !== Tile.wallType.NOWALL) {
    this.ctx.lineWidth = this.lineWidth * (tile.downWall === Tile.wallType.HARD ? 3 : 1);
    this.ctx.beginPath();
    this.ctx.moveTo(tile.i * this.tileSize, (tile.j + 1) * this.tileSize);
    this.ctx.lineTo((tile.i + 1) * this.tileSize, (tile.j + 1) * this.tileSize);
    this.ctx.stroke();
  }
  if (tile.leftWall !== Tile.wallType.NOWALL) {
    this.ctx.lineWidth = this.lineWidth * (tile.leftWall === Tile.wallType.HARD ? 3 : 1);
    this.ctx.beginPath();
    this.ctx.moveTo(tile.i * this.tileSize, tile.j * this.tileSize);
    this.ctx.lineTo(tile.i * this.tileSize, (tile.j + 1) * this.tileSize);
    this.ctx.stroke();
  }
  if (tile.rightWall !== Tile.wallType.NOWALL) {
    this.ctx.lineWidth = this.lineWidth * (tile.rightWall === Tile.wallType.HARD ? 3 : 1);
    this.ctx.beginPath();
    this.ctx.moveTo((tile.i + 1) * this.tileSize, tile.j * this.tileSize);
    this.ctx.lineTo((tile.i + 1) * this.tileSize, (tile.j + 1) * this.tileSize);
    this.ctx.stroke();
  }
};

