function Tile(i, j, k) {
	this.i = i; // Position in level.tileArray
	this.j = j; // Position in level.tileArray
	this.k = k; // vertical position in the tileArray, in case there are multiple levels.
	this.x = i + 1 / 2;
	this.y = j + 1 / 2;
	this.type = 0; // 0 means is hasn't been filled by a corridor yet. 1 means it's inaccessible. All tiles in the same corridor have the same type.
	this.upWall = 1;
	this.rightWall = 1;
	this.leftWall = 1;
	this.downWall = 1;
	this.nearbyEnnemies = new Array(); // used to optimize collision detection. Each tile remembers the ennemies that are nearby
}


Tile.wallType = { NOWALL: 0, SOFT: 1, HARD: 2 }


Tile.prototype.newType = function(type) {
	this.type = type;
}
