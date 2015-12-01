var ennemyDifficulty=0.1; //Higher means more ennemies will appear. Harder. Standard=0.1
var maxEnnemyPerRow=2; //number of ennemies per corridors. Higher is harder. standard=2
var lengthDifficulty=0.05; //Higher means shorter corridors. Harder. standard= 0.05
var switchDifficulty=0.4; //Higher means more tortuous corridors. Easier. standard=0.4


function Level(tileSize,tileTableWidth,tileTableHeight,robotRadius) {
  this.tileTableHeight=tileTableHeight; //size of the tileTable
  this.tileTableWidth=tileTableWidth;
  this.tileSize=tileSize
  this.tileTable=new Array(); //the actual maze
  this.playerTable=new Array(); //listing the players currently playing on the Level
  this.ennemyTable=new Array(); //listing the ennemies currently navigating on the level
  this.robotRadius=robotRadius;
  this.ennemySpeed=0.02*this.tileSize/30;
  this.playerSpeed=0.07*this.tileSize/30;
  //this.playerSpeed=0.01*this.tileSize/30;

  this.robotRadius=tileSize/2;
  this.ennemyColor="#7f8c8d";
  this.robotColor="#2c3e50";
  this.robotRadius=this.tileSize/5;
  this.lineWidth=2; //The width of the walls to draw
  this.wallColor="#2c3e50";
  this.cameraX=0; //when the camera moves
  this.cameraY=0; //when the camera moves

  this.maxEnnemyPerRow;
  this.maxJumpingRadius=this.robotRadius*1.3; //max of the Robot radius during a jump
  this.lastTime=Date.now(); //use for gaps in rendering
  this.currentlyPlaying=true; //are we paused?

}

Level.prototype.startTouch=function() {
  this.playerTable[0].startAJump();
}
Level.prototype.endTouch=function() {
  //do nothing for now.
}

Level.prototype.addANewPlayer=function() {
  var newPlayer= new Robot(this.tileTable[0][0],this,this.playerSpeed,false); //creates a new player on the origin tile
  if (this.tileTable[0][0].rightWall==1) newPlayer.direction=3; //could be done more elegantly. A bit of a hack
  this.playerTable.push(newPlayer);
  /*newPlayer.on('dead',function(){
    console.log('the player is dead');
    newPlayer.reposition(this.tileTable[0][0]); //reposition the player that just lost at the origin of the tileTable
  });
  */

}

Level.prototype.reset=function() {
  this.tileTable=new Array();
	for (var i=0;i<this.tileTableWidth;i++) {
		this.tileTable[i]=new Array();
		for (var j=0;j<this.tileTableHeight;j++) {
			this.tileTable[i][j]=new Tile(i,j,0,0,this);
			if (i==0) this.tileTable[i][j].leftWall=2;
			if (i==this.tileTableWidth-1) this.tileTable[i][j].rightWall=2;
			if (j==0) this.tileTable[i][j].upWall=2;
			if (j==this.tileTableHeight-1) this.tileTable[i][j].downWall=2;
		}
	}
	ennemyTable=new Array();
  //this.playerTable[0].lost(); //sends a signal to come back here. Need to improve
}

Level.prototype.createNewLevel=function() {
  this.reset();
	//first add the square
	//addEmptyRectangle(10,10,20,5);
	//addEmptyRectangle(20,1,5,20);
	//addEmptyRectangle(1,10,35,5);
	//addRandomRectangles();

	for (var i=0;i<this.tileTableWidth;i++) {
		for (var j=0;j<this.tileTableHeight;j++) {
			var t=this.tileTable[i][j];

			var XX=0;
			var YY=0;
			var rand=Math.random();
      //first need to decide the direction in which this corridor will start
			//rand=0;
			if (rand<0.25) XX=1;
			else if (rand<0.5) XX=-1;
			else if (rand<0.75) YY=1;
			else YY=-1;
			var ennemyLeft=maxEnnemyPerRow;
			if (i==0 && j==0) ennemyLeft=0;

			this.createPath(t,lengthDifficulty,switchDifficulty,ennemyDifficulty,1,0,Math.floor(Math.random()*5)+1,0,ennemyLeft);

		}
	}
	//renderInitial();
	//addARandomObjective();
}

Level.prototype.createPath=function(startTile,lengthProba,switchbacksProba,ennemyProba,currentX,currentY,currentType,currentLength,maxNumberEnnemy) {
  //recursive function to create a corridor in a tile Array
	if (startTile.type!=0) return; //Means you've ended on a tile that has already been filed up
	startTile.newType(currentType);
	var ennemyLeft=maxNumberEnnemy;

	if (Math.random()<ennemyProba && ennemyLeft>0 && currentLength>2) {
    //add an ennemy on this tile
		var ennemy=new Robot(startTile,this,this.ennemySpeed,true,this.ennemyColor);
		ennemyLeft--;
	}
	var X=currentX; //current direction of the corridor being built
	var Y=currentY; //current direction of the corridor
	var i=startTile.i;
	var j=startTile.j;
	var nextTile;
	if (Math.random()>lengthProba || currentLength<2) {
		//we don't stop right there
		var switchback=false;
		if (Math.random()<switchbacksProba) switchback=true;
		if (X>0 && (i>=this.tileTableWidth-1 || this.tileTable[i+1][j].type>0 || switchback)) {
			//cannot move to the right as planned
				if (Math.random()>0.5 && j<this.tileTableHeight-1 && this.tileTable[i][j+1].type==0) {
					//move down
					X=0;
					Y=1;
				}
				else if (j>0 && this.tileTable[i][j-1].type==0 ) {
					//move up
					X=0;
					Y=-1;
				}
				else if (j<this.tileTableHeight-1 && this.tileTable[i][j+1].type==0) {
					//move down
					X=0;
					Y=1;
				}
				else {
					X=0;
					Y=0;
				}
		}
		else if (X<0 && (i==0 || this.tileTable[i-1][j].type>0 || switchback)) {
			//cannot move to the left as planned
				if (Math.random()>0.5 && j<this.tileTableHeight-1 && this.tileTable[i][j+1].type==0) {
					//move down
					X=0;
					Y=1;
				}
				else if (j>0 && this.tileTable[i][j-1].type==0 ) {
					//move up
					X=0;
					Y=-1;
				}
				else if (j<this.tileTableHeight-1 && this.tileTable[i][j+1].type==0) {
					//move down
					X=0;
					Y=1;
				}
				else {
					X=0;
					Y=0;
				}
		}
		else if (Y>0 && (j>=this.tileTableHeight-1 || this.tileTable[i][j+1].type>0 || switchback)) {
			//cannot move down as planned
				if (Math.random()>0.5 && i<this.tileTableWidth-1 && this.tileTable[i+1][j].type==0) {
					//move right
					X=1;
					Y=0;
				}
				else if (i>0 && this.tileTable[i-1][j].type==0 ) {
					//move left
					X=-1;
					Y=0;
				}
				else if (i<this.tileTableWidth-1 && this.tileTable[i+1][j].type==0) {
					//move right
					X=1;
					Y=0;
				}
				else {
					X=0;
					Y=0;
				}
		}
		else if (Y<0 && (j==0 || this.tileTable[i][j-1].type>0 || switchback)) {
			//cannot move up as planned
				if (Math.random()>0.5 && i<this.tileTableWidth-1 && this.tileTable[i+1][j].type==0) {
					//move right
					X=1;
					Y=0;
				}
				else if (i>0 && this.tileTable[i-1][j].type==0 ) {
					//move left
					X=-1;
					Y=0;
				}
				if (i<this.tileTableWidth-1 && this.tileTable[i+1][j].type==0) {
					//move right
					X=1;
					Y=0;
				}
				else {
					X=0;
					Y=0;
				}
		}

		nextTile=this.tileTable[i+X][j+Y];
		if (X>0) {
			startTile.rightWall=0;
			nextTile.leftWall=0;
		}
		else if (X<0) {
			startTile.leftWall=0;
			nextTile.rightWall=0;
		}
		else if (Y>0) {
			startTile.downWall=0;
			nextTile.upWall=0;
		}
		else if (Y<0) {
			startTile.upWall=0;
			nextTile.downWall=0;
		}
		if (X!=0 || Y!=0) this.createPath(nextTile,lengthProba,switchbacksProba,ennemyProba,X,Y,currentType,currentLength+1,ennemyLeft);
		//else if (currentLength==0) startTile.type=0;
	}
}

Level.prototype.render=function() {
    //console.log("render");
  	cxt.clearRect ( 0, 0 , canvas.width , canvas.height ); //not the most efficient way to go
    //console.log(this.tileTableHeight);
    //console.log(this.tileTableWidth);

  	for (var i=0;i<this.tileTableWidth;i++) {
  		for (var j=0;j<this.tileTableHeight;j++) {
        //console.log("draw");
  			var t=this.tileTable[i][j];
  			t.draw();
  		}
  	}

  	var l=ennemyTable.length;
  	for (var i=0;i<l;i++) {
  		this.ennemyTable[i].draw();
  	}
    l=this.playerTable.length;
    for (var i=0;i<l;i++) {
      this.playerTable[i].draw();
    }
    /*
  	var tim=Date.now()-timerNewLevel;
  	if (tim<3000) {
  		cxt.clearRect(canvas.width/2-200,canvas.height/2-30,400,60);
  		cxt.font="20px Georgia";
  		cxt.textAlign="center";
  		cxt.fillText("Difficulty:"+ennemyDifficulty,canvas.width/2,canvas.height/2);
  	}
  	else if(tim<3200) renderInitial();
    */
}

Level.prototype.update=function() {
  var newTime=Date.now();
  var timeGap=(newTime-this.lastTime);
  this.lastTime=newTime;

  if (this.currentlyPlaying) {
    var l=this.ennemyTable.length;
    for (var i=0;i<l;i++) {
      //ennemyTable[i].updatePosition(timeGap);
    }
    l=this.playerTable.length;
    for (var i=0;i<l;i++) {
      this.playerTable[i].updatePosition(timeGap);
    }
    //console.log("rendering");
    this.render();
  }

}
