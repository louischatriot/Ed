function Tile(i,j,k,level) {
	this.level = level;
	this.i = i; // Position in level.tileArray
	this.j = j; // Position in level.tileArray
	this.k = k; // vertical position in the tileArray, in case there are multiple levels.
	this.x = level.tileSize * i + level.tileSize / 2;
	this.y = level.tileSize * j + level.tileSize / 2;
	this.type = 0; // 0 means is hasn't been filled by a corridor yet. All tiles in the same corridor have the same type
  this.toDraw = true;
	this.color = level.colorTable[this.type];
	this.upWall = 1;
	this.rightWall = 1;
	this.leftWall = 1;
	this.downWall = 1;
	this.nearbyEnnemies = new Array(); // used to optimize collision detection. Each tile remembers the ennemies that are nearby
}


Tile.wallType = { NOWALL: 0, SOFT: 1, HARD: 2 }


Tile.prototype.newType = function(type) {
	this.type = type;
	this.color = this.level.colorTable[type];
}


Tile.prototype.draw = function() {
  if (this.toDraw) {
    //First draw the square itself
    cxt.fillStyle = this.color;
    cxt.fillRect(this.i * this.level.tileSize - this.level.cameraX, this.j * this.level.tileSize - this.level.cameraY, this.level.tileSize, this.level.tileSize);

    //Next draw the walls
    cxt.strokeStyle = this.level.wallColor;
    if (this.upWall !== Tile.wallType.NOWALL) {
      cxt.lineWidth = this.level.lineWidth;
      if (this.upWall === Tile.wallType.HARD) cxt.lineWidth = 3 * this.level.lineWidth;
      cxt.beginPath();
      cxt.moveTo(this.i * this.level.tileSize - this.level.cameraX, this.j * this.level.tileSize - this.level.cameraY);
      cxt.lineTo((this.i + 1) * this.level.tileSize - this.level.cameraX, this.j * this.level.tileSize - this.level.cameraY);
      cxt.stroke();
    }
    if (this.downWall !== Tile.wallType.NOWALL) {
      cxt.lineWidth = this.level.lineWidth;
      if (this.downWall === Tile.wallType.HARD) cxt.lineWidth = 3 * this.level.lineWidth;
      cxt.beginPath();
      cxt.moveTo(this.i * this.level.tileSize - this.level.cameraX, (this.j + 1) * this.level.tileSize - this.level.cameraY);
      cxt.lineTo((this.i + 1) * this.level.tileSize - this.level.cameraX, (this.j + 1) * this.level.tileSize - this.level.cameraY);
    }
    if (this.rightWall !== Tile.wallType.NOWALL) {
      cxt.lineWidth = this.level.lineWidth;
      if (this.rightWall === Tile.wallType.HARD) cxt.lineWidth = 3 * this.level.lineWidth;
      cxt.beginPath();
      cxt.moveTo((this.i + 1) * this.level.tileSize - this.level.cameraX, this.j * this.level.tileSize - this.level.cameraY);
      cxt.lineTo((this.i + 1) * this.level.tileSize - this.level.cameraX,(this.j + 1) * this.level.tileSize - this.level.cameraY);
      cxt.stroke();
    }
    if (this.leftWall !== Tile.wallType.NOWALL) {
      cxt.lineWidth = this.level.lineWidth;
      if (this.leftWall === Tile.wallType.HARD) cxt.lineWidth = 3 * this.level.lineWidth;
      cxt.beginPath();
      cxt.moveTo(this.i * this.level.tileSize - this.level.cameraX, this.j * this.level.tileSize - this.level.cameraY);
      cxt.lineTo(this.i * this.level.tileSize - this.level.cameraX,(this.j + 1) * this.level.tileSize - this.level.cameraY);
      cxt.stroke();
    }
  }
}
