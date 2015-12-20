function Tile(i, j, k) {
	this.i = i; // Position in level.tileArray
	this.j = j; // Position in level.tileArray
	this.k = k; // vertical position in the tileArray, in case there are multiple levels.
	this.type = 0; // 0 means is hasn't been filled by a corridor yet. 1 means it's inaccessible. All tiles in the same corridor have the same type.
	this.upWall = 1;
	this.rightWall = 1;
	this.leftWall = 1;
	this.downWall = 1;
}


Tile.wallType = { NOWALL: 0, SOFT: 1, HARD: 2 }


Tile.prototype.newType = function (type) {
	this.type = type;
}


Tile.prototype.center = function () {
  return { x: this.i + 1 / 2, y: this.j + 1 / 2 };
};

