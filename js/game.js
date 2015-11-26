// Create the canvas
var canvas = document.createElement("canvas");
canvas.style.border = "none";
var cxt = canvas.getContext("2d");

canvas.width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
canvas.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);


document.body.appendChild(canvas);
document.body.appendChild(canvas);



var cellSize=30;
var lineWidth=1;

if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) {
	cellSize=60;
	lineWidth=5;
}

var tableWidth=Math.floor(canvas.width/cellSize);
var tableHeight=Math.floor(canvas.height/cellSize);

var screenTableHeight=Math.floor(canvas.height/cellSize);
var screenTableWidth=Math.floor(canvas.width/cellSize);

var ballRadius=cellSize/5;
var ballColor="#2c3e50";
var wallColor="#2c3e50";
var squareTable=new Array();
var mDown;
var currentI;
var currentJ;
var lastTime=Date.now();

var twoPlayers=false;


var cameraXInitial=-(canvas.width-tableWidth*cellSize)/2;
var cameraYInitial=-(canvas.height-tableHeight*cellSize)/2;
cameraXInitial=0;
cameraYInitial=0;

cameraX=cameraXInitial;
cameraY=cameraYInitial;

var drawContour=function() {
	cxt.fillStyle="#2c3e50";
	cxt.fillRect(0,0,canvas.width,canvas.height);
}
//drawContour();

var ballSpeed=0.07*cellSize/30;
var ennemySpeed=0.02*cellSize/30;

var currentlyPlaying=true;
var ennemyBallTable=new Array();
var ennemyColor="#7f8c8d";


var maxJumpingRadius=ballRadius*1.3;
var speedRadiusIncrease=(maxJumpingRadius-ballRadius)*2*ballSpeed/cellSize;

var colorTable=["#ecf0f1","#1abc9c","#9b59b6","#e74c3c","#f1c40f","#95a5a6","#2c3e50"]; //mixed tones
colorTable=["#ecf0f1","#3498db","#2980b9","#16a085","#1abc9c","#27ae60","#2c3e50"]; //blue tones
colorTable=["#ecf0f1","#f1c40f","#e67e22","#d35400","#f39c12","#e74c3c","#2c3e50"]; //red tones



var timerNewLevel;



function square(i,j,type) {
	this.i=i;
	this.j=j;
	this.type=type;
	this.color=colorTable[type];
	this.pin; //is there a color pin on the square
	this.upWall=true;
	this.rightWall=true;
	this.leftWall=true;
	this.downWall=true;
	this.height=1;
	this.upBoundary=false;
	this.rightBoundary=false;
	this.leftBoundary=false;
	this.downBoundary=false;
	this.newType=function(type) {
		this.type=type;
		this.color=colorTable[type];
	}
	//for (var prop in obj) this[prop] = obj[prop];
	this.draw=function() {
		//draw the square

		var plus=cellSize+5*(this.height-1);
		if (this.type>0) {
			cxt.fillStyle=this.color;
			cxt.fillRect(this.i*cellSize-cameraX-(plus-cellSize)/2,this.j*cellSize-cameraY-(plus-cellSize)/2,plus,plus);
			//draw the walls
			
			//cxt.globalAlpha=1;
			cxt.strokeStyle=wallColor;
			//cxt.strokeStyle="#FF7F50";
			if (this.upWall) {
				cxt.lineWidth=lineWidth;
				if (this.upBoundary) cxt.lineWidth=3*lineWidth;
				cxt.beginPath();
				cxt.moveTo(this.i*cellSize-cameraX-(plus-cellSize)/2,this.j*cellSize-cameraY-(plus-cellSize)/2);
				cxt.lineTo((this.i+1)*cellSize-cameraX+(plus-cellSize)/2,this.j*cellSize-cameraY-(plus-cellSize)/2); //should handle the starting issues.
				cxt.stroke();
			}
			if (this.downWall) {
				cxt.lineWidth=lineWidth;
				if (this.downBoundary) cxt.lineWidth=3*lineWidth;
				cxt.beginPath();
				cxt.moveTo(this.i*cellSize-cameraX-(plus-cellSize)/2,(this.j+1)*cellSize-cameraY+(plus-cellSize)/2);
				cxt.lineTo((this.i+1)*cellSize-cameraX+(plus-cellSize)/2,(this.j+1)*cellSize-cameraY+(plus-cellSize)/2); //should handle the starting issues.
				cxt.stroke();
			}
			if (this.rightWall) {
				cxt.lineWidth=lineWidth;
				if (this.rightBoundary) cxt.lineWidth=3*lineWidth;
				cxt.beginPath();
				cxt.moveTo((this.i+1)*cellSize-cameraX+(plus-cellSize)/2,this.j*cellSize-cameraY-(plus-cellSize)/2);
				cxt.lineTo((this.i+1)*cellSize-cameraX+(plus-cellSize)/2,(this.j+1)*cellSize-cameraY+(plus-cellSize)/2); //should handle the starting issues.
				cxt.stroke();
			}
			if (this.leftWall) {
				cxt.lineWidth=lineWidth;
				if (this.leftBoundary) cxt.lineWidth=3*lineWidth;
				cxt.beginPath();
				cxt.moveTo(this.i*cellSize-cameraX-(plus-cellSize)/2,this.j*cellSize-cameraY-(plus-cellSize)/2);
				cxt.lineTo(this.i*cellSize-cameraX-(plus-cellSize)/2,(this.j+1)*cellSize-cameraY+(plus-cellSize)/2); //should handle the starting issues.
				cxt.stroke();
			}
		
		}
	}
}

var splitY=3.5;
var radiusFeet=3;
var maxAmplitudeX=4;
var feetColor="#34495e"

function ball(x,y) {
	this.x=x;
	this.y=y;
	this.jumping=false;
	this.lastTime=Date.now();
	this.jumpingUp=true;
	this.speed=ballSpeed;
	this.color=ballColor;
	this.ennemy=true;
	this.radius=ballRadius;
	this.amplitudeX=0;
	this.deltaAmplitudeX=2;
	this.erase=function() {
		this.currentSquare().draw();
		var nextt=this.previousSquare();
		if (nextt) nextt.draw();
	}
	this.draw=function() {
		
		if (this.directionX!=0 && !this.ennemy) {
			cxt.beginPath();
			cxt.arc(this.x+this.amplitudeX-cameraX,this.y-splitY-cameraY,radiusFeet,0,2*Math.PI);
			cxt.fillStyle = feetColor;
			cxt.closePath();
			cxt.fill();
			cxt.beginPath();
			cxt.arc(this.x-this.amplitudeX-cameraX,this.y+splitY-cameraY,radiusFeet,0,2*Math.PI);
			cxt.fillStyle = feetColor;
			cxt.closePath();
			cxt.fill();
		}	
		else if (!this.ennemy) {
			cxt.beginPath();
			cxt.arc(this.x-splitY-cameraX,this.y+this.amplitudeX-cameraY,radiusFeet,0,2*Math.PI);
			cxt.fillStyle = feetColor;
			cxt.closePath();
			cxt.fill();
			cxt.beginPath();
			cxt.arc(this.x+splitY-cameraX,this.y-this.amplitudeX-cameraY,radiusFeet,0,2*Math.PI);
			cxt.fillStyle = feetColor;
			cxt.closePath();
			cxt.fill();
		}
		cxt.beginPath();
		cxt.arc(this.x-cameraX,this.y-cameraY,this.radius,0,2*Math.PI);
		cxt.fillStyle = this.color;
		cxt.closePath();
		cxt.fill();
		
	}
	this.directionX=1; //0 is right, 1 is down, etc
	this.directionY=0;
	
	this.lost=function() {
		this.reposition(squareTable[0][0]);
		cameraX=cameraXInitial;
		cameraY=cameraXInitial;
	}
	this.nextSquare=function() {
		var i=Math.floor(this.x/cellSize);
		var j=Math.floor(this.y/cellSize);
		if (this.directionX>0 && i<tableWidth-1) return squareTable[i+1][j];
		else if (this.directionX<0 && i>0) return squareTable[i-1][j];
		else if (this.directionY>0 && j<tableHeight-1) return squareTable[i][j+1];
		else if (this.directionY<0 && j>0) return squareTable[i][j-1];
	}
	this.previousSquare=function() {
		var i=Math.floor(this.x/cellSize);
		var j=Math.floor(this.y/cellSize);
		if (this.directionX>0 && i>0) return squareTable[i-1][j];
		else if (this.directionX<0 && i<tableWidth-1) return squareTable[i+1][j];
		else if (this.directionY>0 && j>0) return squareTable[i][j-1];
		else if (this.directionY<0 && j<tableHeight-1) return squareTable[i][j+1];
	}
	this.currentSquare=function() {
		var i=Math.floor(this.x/cellSize);
		var j=Math.floor(this.y/cellSize);
		return squareTable[i][j];
	}
	this.distanceToNextCenter=0;
	this.reposition=function(s) {
		this.x=s.i*cellSize+cellSize/2 ;
		this.y=s.j*cellSize+cellSize/2 ;
		this.directionX=1;
		this.directionY=0;
		this.distanceToNextCenter=0;
	}
	
	this.updatePosition=function() {
		var now=Date.now();
		
		if (this.jumping) {
			if (this.jumpingUp) {
				if (this.radius<maxJumpingRadius) this.radius=this.radius+(now-this.lastTime)*speedRadiusIncrease;
				else this.jumpingUp=false;
			}
			else {
				if (this.radius>ballRadius) this.radius=this.radius-(now-this.lastTime)*speedRadiusIncrease;
				else {
					this.radius=ballRadius;
					this.jumping=false;
					this.jumpingUp=true;
				}
			}
		}
		var s=this.currentSquare();
		
		if (!s.upWall || !s.downWall || !s.rightWall || !s.leftWall || this.jumping) {
		
			this.amplitudeX=this.amplitudeX+this.deltaAmplitudeX;
			if (Math.abs(this.amplitudeX)>maxAmplitudeX) {
				this.deltaAmplitudeX=-this.deltaAmplitudeX;
			}
		
		var plusX=(now-this.lastTime)*this.speed*this.directionX;
		var plusY=(now-this.lastTime)*this.speed*this.directionY;
		var newX=this.x+plusX;
		var newY=this.y+plusY;
		if (Math.abs(plusX)>this.distanceToNextCenter || Math.abs(plusY)>this.distanceToNextCenter) {
			this.x=s.i*cellSize+cellSize/2;
			this.y=s.j*cellSize+cellSize/2;
			this.distanceToNextCenter=cellSize;
			//Now figure out where the ball should go
			if (this.directionX>0 && s.rightWall) {
				if (s.downWall) {
					if (s.upWall) {
						this.directionX=-1;
					}
					else {
						this.directionX=0;
						this.directionY=-1;
					}
				}
				else {
					this.directionX=0;
					this.directionY=1;
				}
			}
			else if (this.directionX<0 && s.leftWall) {
				if (s.upWall) {
					if (s.downWall) {
						this.directionX=1;
					}
					else {
						this.directionX=0;
						this.directionY=1;
					}
				}
				else {
					this.directionX=0;
					this.directionY=-1;
				}
			}
			else if (this.directionY>0 && s.downWall) {
				if (s.leftWall) {
					if (s.rightWall) {
						this.directionY=-1;
					}
					else {
						this.directionX=1;
						this.directionY=0;
					}
				}
				else {
					this.directionX=-1;
					this.directionY=0;
				}
			}
			else if (this.directionY<0 && s.upWall) {
				if (s.rightWall) {
					if (s.leftWall) {
						this.directionY=1;
					}
					else {
						this.directionX=-1;
						this.directionY=0;
					}
				}
				else {
					this.directionX=1;
					this.directionY=0;
				}
			}

		}
		else {
			this.x=newX;
			this.y=newY;
			this.distanceToNextCenter=this.distanceToNextCenter-Math.abs(plusX)-Math.abs(plusY);
		}
		}
		this.lastTime=now;
	}
	
	this.startAJump=function() {
		var s=this.currentSquare();
		var testEdge=true;
		var i=s.i;
		var j=s.j;
		if (this.directionX>0 && (s.rightBoundary || (this.distanceToNextCenter>cellSize/2 && (squareTable[i+1][j].rightBoundary)))) testEdge=false;
		else if (this.directionX<0 && (s.leftBoundary || (this.distanceToNextCenter>cellSize/2 && (squareTable[i-1][j].leftBoundary)))) testEdge=false;
		else if (this.directionY>0 && (s.downBoundary || (this.distanceToNextCenter>cellSize/2 && (squareTable[i][j+1].downBoundary)))) testEdge=false;
		else if (this.directionY<0 && (s.upBoundary || (this.distanceToNextCenter>cellSize/2 && (squareTable[i][j-1].upBoundary)))) testEdge=false;
		
		
		if (!this.jumping && testEdge) {
			this.jumping=true;
			if (this.distanceToNextCenter<cellSize && testEdge) {
				this.distanceToNextCenter=this.distanceToNextCenter+cellSize;
			}
		}
	}
}

var myBall=new ball(cellSize/2,cellSize/2);
myBall.ennemy=false;
var secondBall=new ball(cellSize/2,cellSize/2);

var renderInitial = function () {
	for (var i=0;i<tableWidth;i++) {
		for (var j=0;j<tableHeight;j++) {
			var t=squareTable[i][j];
			t.draw();
		}
	}
	var l=ennemyBallTable.length;
	for (var i=0;i<l;i++) {
		ennemyBallTable[i].draw();
	}
	myBall.draw();
	secondBall.draw();
};


var reset=function() {
	for (var i=0;i<tableWidth;i++) {
		squareTable[i]=new Array();
		for (var j=0;j<tableHeight;j++) {
			squareTable[i][j]=new square(i,j,0);
			if (i==0) squareTable[i][j].leftBoundary=true;
			if (i==tableWidth-1) squareTable[i][j].rightBoundary=true;
			if (j==0) squareTable[i][j].upBoundary=true;
			if (j==tableHeight-1) squareTable[i][j].downBoundary=true;
		}
	}
	ennemyBallTable=new Array();
	myBall.lost();
	if (twoPlayers) secondBall.lost();
	renderInitial();
}

reset();

// Handle keyboard controls
var keyDown;

var loadFromJson=function(ja) {
	console.log(JSON.stringify(ja));
	for (var i=0;i<tableWidth;i++) {
		squareTable[i]=new Array();
		for (var j=0;j<tableHeight;j++) {
			var s=new square(i,j,0);
		
			for (var prop in ja.squareTable[i][j]) s[prop]=ja.squareTable[i][j][prop];
				
			squareTable[i][j]=s;
		}
	}
	var e=ja.ennemyTable;
	
	for (var i=0;i<e.length;i++) {
		var enn=new ball(0,0);
		for (var prop in e[i]) enn[prop]=e[i][prop];
		ennemyBallTable[i]=enn;
	}
	myBall.lost();
}


addEventListener("keydown", function (e) {
	e.preventDefault();
	keyDown=e.keyCode;
	if (keyDown==80) currentlyPlaying=!currentlyPlaying;
	else if (keyDown==32 && currentlyPlaying) {
		//start a jump
		myBall.startAJump();
	}
	else if (keyDown==83 ) {
		//save the current drawing
		var labStorage={squareTable:squareTable, ennemyTable:ennemyBallTable};
		localStorage.setItem( 'labStorage', JSON.stringify(labStorage) );
		console.log(JSON.stringify(labStorage));
	}
	else if (keyDown==82) {
		if (localStorage.getItem('labStorage')) {
			//localStorage is not empty
			var labStorage=JSON.parse(localStorage.getItem( 'labStorage' ) );
			loadFromJson(labStorage);
			console.log(localStorage.getItem( 'labStorage' ));
		}
	}
	else if (keyDown==88) {
		reset();
	}
	
	console.log(e.keyCode);
}, false);

//currentlyPlaying=true;

addEventListener("keyup", function (e) {
	keyDown=0;
}, false);

//handle clicks of the mouse to create balls.

var mouseIsDown = function(e) {
	mDown=true;
	//if it's coming from a touchEvent, we should focus on the changed event
	var x=e.layerX;
	var y=e.layerY;
	if (e.changedTouches) {
		var latestTouch=e.changedTouches[0];
		var x=latestTouch.pageX;
		var y=latestTouch.pageY;
		if (x<canvas.width/2) myBall.startAJump();
		else secondBall.startAJump();
		//e.preventDefault();
	}
	
	//console.log(e);
	currentI=Math.floor(x/cellSize);
	// q=81 w=87 e=69
	currentJ=Math.floor(y/cellSize);

	currentSquare=squareTable[currentI][currentJ];
	//currentSquare.height++;
	
	for (var i=0;i<ennemyBallTable.length;i++) {
		if ((Math.abs(x-ennemyBallTable[i].x)<ballRadius) && (Math.abs(y-ennemyBallTable[i].y)<ballRadius)) {
			ennemyBallTable.splice(i,1);
			i=ennemyBallTable.length;
		}
	}
	
	if (keyDown>48 && keyDown<60) {
		currentSquare.newType(keyDown-49);
		if (keyDown==49) {
			currentSquare.upWall=true;
			currentSquare.downWall=true;
			currentSquare.rightWall=true;
			currentSquare.leftWall=true;
			
		}
	}
	else if (keyDown==69) {
		//drop an ennemy
		var ennemy=new ball(0,0);
		ennemyBallTable[ennemyBallTable.length]=ennemy;
		ennemy.color=ennemyColor;
		ennemy.speed=ennemySpeed;
		ennemy.reposition(currentSquare);
		
	}
	
	render();
	
}

var mouseIsUp=function(e) {
	mDown=false;
}

var mouseIsMoving=function(e) {
	e.preventDefault();
	
	if (mDown) {
		var x=e.layerX;
		var y=e.layerY;
		if (e.changedTouches) {
			var latestTouch=e.changedTouches[0]; 
			var x=latestTouch.pageX;
			var y=latestTouch.pageY;
		}
		var i=Math.floor(x/cellSize);
		var j=Math.floor(y/cellSize);
				
		if (i!=currentI || j!=currentJ) {
			//mouse just moved to a new square
			var currentSquare=squareTable[i][j];
			var previousSquare=squareTable[currentI][currentJ];
		
			if (currentI<i) {
				previousSquare.rightWall=false;
				currentSquare.leftWall=false;	
			}
			if (currentI>i) {
				previousSquare.leftWall=false;
				currentSquare.rightWall=false;	
			}
			if (currentJ<j) {
				previousSquare.downWall=false;
				currentSquare.upWall=false;	
			}
			if (currentJ>j) {
				previousSquare.upWall=false;
				currentSquare.downWall=false;	
			}
			if (keyDown>48 && keyDown<60) {
				currentSquare.newType(keyDown-49);
			}
			if (keyDown==49) {
				currentSquare.upWall=true;
				currentSquare.downWall=true;
				currentSquare.rightWall=true;
				currentSquare.leftWall=true;
				previousSquare.upWall=true;
				previousSquare.downWall=true;
				previousSquare.rightWall=true;
				previousSquare.leftWall=true;
			
			}
			currentI=i;
			currentJ=j;
			
		}

	}
	render();
}


addEventListener('mousedown', mouseIsDown, true);
addEventListener('mouseup', mouseIsUp, true);
addEventListener('mousemove', mouseIsMoving, true);
addEventListener('touchstart', mouseIsDown, true);
addEventListener('touchmove', mouseIsMoving, true);
addEventListener('touchend', mouseIsUp, true);

// Draw everything

var addEmptyRectangle=function(startI,startJ,width,height) {
	for (var i=startI;i<startI+width;i++) {
		for (var j=startJ;j<startJ+height;j++) {
			var s=squareTable[i][j];
			s.type=6;
			s.color=colorTable[s.type];
			s.rightWall=false;
			s.upWall=false;
			s.downWall=false;
			s.leftWall=false;
			
		}
	}
}

var render = function () {
	//cxt.clearRect ( 0, 0 , canvas.width , canvas.height );
	/*
	for (var i=0;i<tableSize;i++) {
		for (var j=0;j<tableSize;j++) {
			var t=squareTable[i][j]
			t.draw();
		}
	}
	*/
	var l=ennemyBallTable.length;
	for (var i=0;i<l;i++) {
		ennemyBallTable[i].erase();
	}
	myBall.erase();
	secondBall.erase();
	for (var i=0;i<l;i++) {
		ennemyBallTable[i].draw();
	}
	myBall.draw();
	if (twoPlayers) secondBall.draw();
	myObjective.draw();
	var tim=Date.now()-timerNewLevel;
	if (tim<3000) {
		cxt.clearRect(canvas.width/2-200,canvas.height/2-30,400,60);
		cxt.font="20px Georgia";
		cxt.textAlign="center";
		cxt.fillText("Difficulty:"+ennemyDifficulty,canvas.width/2,canvas.height/2);
	}
	else if(tim<3200) renderInitial();
};

var render2 = function () {
	var s=myBall.currentSquare();
	
	//cxt.clearRect (s.i*cellSize, s.j*cellSize , cellSize , cellSize );
	s.draw();
	var i=s.i;
	var j=s.j;
	if (i>0) squareTable[i-1][j].draw();
	if (i<tableWidth) squareTable[i+1][j].draw();
	if (j>0) squareTable[i][j-1].draw();
	if (j<tableHeight) squareTable[i][j+1].draw();
	
	myBall.draw();
};

var checkInterception=function() {
	var l=ennemyBallTable.length;
	var ennemy;
	for (var i=0;i<l;i++) {
		ennemy=ennemyBallTable[i];
		if (Math.abs(ennemy.x-myBall.x)<ballRadius*2 && Math.abs(ennemy.y-myBall.y)<ballRadius*2) {
			myBall.lost();
			renderInitial();
		}
		if (twoPlayers && Math.abs(ennemy.x-secondBall.x)<ballRadius*2 && Math.abs(ennemy.y-secondBall.y)<ballRadius*2) {
			secondBall.lost();
			renderInitial();
		}
	}
	if ((Math.abs(myObjective.x-myBall.x)<ballRadius*2 && Math.abs(myObjective.y-myBall.y)<ballRadius*2) || (Math.abs(myObjective.x-secondBall.x)<ballRadius*2 && Math.abs(myObjective.y-secondBall.y)<ballRadius*2)) {
		//you win
		ennemyDifficulty=ennemyDifficulty*1.05;
		maxEnnemyPerRow=ennemyDifficulty*2/0.1-1;
		localStorage.setItem( 'ennemyDifficulty', ennemyDifficulty );
		createNewLevel();
	}
}

var myObjective;

var createPath=function(startSquare,lengthProba,switchbacksProba,ennemyProba,currentX,currentY,currentType,currentLength,maxNumberEnnemy) {
	if (startSquare.type!=0) return;
	startSquare.newType(currentType);
	var ennemyLeft=maxNumberEnnemy;
	
	if (Math.random()<ennemyProba && ennemyLeft>0 && currentLength>2) {
		var ennemy=new ball(0,0);
		ennemyBallTable[ennemyBallTable.length]=ennemy;
		ennemy.color=ennemyColor;
		ennemy.speed=ennemySpeed;
		ennemy.reposition(startSquare);
		ennemyLeft--;
	}
	var X=currentX;
	var Y=currentY;
	var i=startSquare.i;
	var j=startSquare.j;
	var nextSquare;
	if (Math.random()>lengthProba || currentLength<2) {
		//we don't stop right there
		var switchback=false;
		if (Math.random()<switchbacksProba) switchback=true;
		if (X>0 && (i>=tableWidth-1 || squareTable[i+1][j].type>0 || switchback)) {
			//cannot move to the right as planned
				if (Math.random()>0.5 && j<tableHeight-1 && squareTable[i][j+1].type==0) {
					//move down
					X=0;
					Y=1;
				}
				else if (j>0 && squareTable[i][j-1].type==0 ) {
					//move up
					X=0;
					Y=-1;
				}
				else if (j<tableHeight-1 && squareTable[i][j+1].type==0) {
					//move down
					X=0;
					Y=1;
				}
				else {
					X=0;
					Y=0;
				}
		}
		else if (X<0 && (i==0 || squareTable[i-1][j].type>0 || switchback)) {
			//cannot move to the left as planned
				if (Math.random()>0.5 && j<tableHeight-1 && squareTable[i][j+1].type==0) {
					//move down
					X=0;
					Y=1;
				}
				else if (j>0 && squareTable[i][j-1].type==0 ) {
					//move up
					X=0;
					Y=-1;
				}
				else if (j<tableHeight-1 && squareTable[i][j+1].type==0) {
					//move down
					X=0;
					Y=1;
				}
				else {
					X=0;
					Y=0;
				}
		}
		else if (Y>0 && (j>=tableHeight-1 || squareTable[i][j+1].type>0 || switchback)) {
			//cannot move down as planned
				if (Math.random()>0.5 && i<tableWidth-1 && squareTable[i+1][j].type==0) {
					//move right
					X=1;
					Y=0;
				}
				else if (i>0 && squareTable[i-1][j].type==0 ) {
					//move left
					X=-1;
					Y=0;
				}
				else if (i<tableWidth-1 && squareTable[i+1][j].type==0) {
					//move right
					X=1;
					Y=0;
				}
				else {
					X=0;
					Y=0;
				}
		}
		else if (Y<0 && (j==0 || squareTable[i][j-1].type>0 || switchback)) {
			//cannot move up as planned
				if (Math.random()>0.5 && i<tableWidth-1 && squareTable[i+1][j].type==0) {
					//move right
					X=1;
					Y=0;
				}
				else if (i>0 && squareTable[i-1][j].type==0 ) {
					//move left
					X=-1;
					Y=0;
				}
				if (i<tableWidth-1 && squareTable[i+1][j].type==0) {
					//move right
					X=1;
					Y=0;
				}
				else {
					X=0;
					Y=0;
				}
		}
		
		nextSquare=squareTable[i+X][j+Y];
		if (X>0) {
			startSquare.rightWall=false;
			nextSquare.leftWall=false;
		}
		else if (X<0) {
			startSquare.leftWall=false;
			nextSquare.rightWall=false;
		}
		else if (Y>0) {
			startSquare.downWall=false;
			nextSquare.upWall=false;
		}
		else if (Y<0) {
			startSquare.upWall=false;
			nextSquare.downWall=false;
		}
		if (X!=0 || Y!=0) createPath(nextSquare,lengthProba,switchbacksProba,ennemyProba,X,Y,currentType,currentLength+1,ennemyLeft);
		//else if (currentLength==0) startSquare.type=0;
	}
}

var addARandomObjective=function() {
	myObjective=new ball();
	myObjective.reposition(squareTable[tableWidth-1][tableHeight-1]);
	myObjective.speed=0;
	myObjective.color="#3498db";
}

var ennemyDifficulty=0.1; //Higher means more ennemies will appear. Harder. Standard=0.1
var maxEnnemyPerRow=2; //number of ennemies per corridors. Higher is harder. standard=2
var lengthDifficulty=0.05; //Higher means shorter corridors. Harder. standard= 0.05
var switchDifficulty=0.4; //Higher means more tortuous corridors. Easier. standard=0.4

if (localStorage.getItem('ennemyDifficulty')) {
	//localStorage is not empty
	ennemyDifficulty=localStorage.getItem( 'ennemyDifficulty' );
	console.log(ennemyDifficulty)

}


var adjustCamera=function() {
	if (myBall.x>cameraX+canvas.width) cameraX=cameraX+canvas.width;
	else if (myBall.x<cameraX) cameraX=cameraX-canvas.width;
	else if (myBall.y>cameraY+canvas.height) cameraY=cameraY+canvas.height;
	else if (myBall.y<cameraY) cameraY=cameraY-canvas.height;
	else return;
	renderInitial();
}

var marginCamera=0.6

var adjustCamera2=function() {
	if (myBall.x>cameraX+canvas.width*marginCamera) cameraX=myBall.x-canvas.width*marginCamera;
	else if (myBall.x<cameraX+canvas.width*(1-marginCamera)) cameraX=myBall.x-canvas.width*(1-marginCamera);
	else if (myBall.y>cameraY+canvas.height*marginCamera) cameraY=myBall.y-canvas.height*marginCamera;
	else if (myBall.y<cameraY+canvas.height*(1-marginCamera)) cameraY=myBall.y-canvas.height*(1-marginCamera);
	else return;
	renderInitial();
}




var addRandomRectangles=function() {
	var number=Math.random()*10;
	for (var i=0;i<number;i++) {
		var startI=Math.floor(Math.random()*(tableWidth-1))+1;
		var startJ=Math.floor(Math.random()*(tableHeight-1))+1;
		var width=Math.random()*(tableWidth-startI-1);
		var height=Math.random()*(tableHeight-startJ-1);
		addEmptyRectangle(startI,startJ,width,height);
	}
}

var createNewLevel=function() {
	reset();
	//first add the square
	//addEmptyRectangle(10,10,20,5);
	//addEmptyRectangle(20,1,5,20);
	//addEmptyRectangle(1,10,35,5);
	//addRandomRectangles();
	
	for (var i=0;i<tableWidth;i++) {
		for (var j=0;j<tableHeight;j++) {
			var t=squareTable[i][j];
		
			var XX=0;
			var YY=0;
			var rand=Math.random();
			//rand=0;
			if (rand<0.25) XX=1;
			else if (rand<0.5) XX=-1;
			else if (rand<0.75) YY=1;
			else YY=-1;
			var ennemyLeft=maxEnnemyPerRow;
			if (i==0 && j==0) ennemyLeft=0;
		
			createPath(t,lengthDifficulty,switchDifficulty,ennemyDifficulty,1,0,Math.floor(Math.random()*5)+1,0,ennemyLeft);
		
		}
	}
	renderInitial();
	addARandomObjective();
	timerNewLevel=Date.now();
	
}

createNewLevel();


var main = function () {
	if (currentlyPlaying) {
	//console.log(currentlyPlaying);
		var l=ennemyBallTable.length;
		for (var i=0;i<l;i++) {
			var e=ennemyBallTable[i];
			e.updatePosition();
		}
		myBall.updatePosition();
		if (twoPlayers) secondBall.updatePosition();

		
		//adjustCamera2();
		checkInterception();
		render();
		//renderInitial();
	}
	else renderInitial();
};


setInterval(main, 30);
/*
if (currentlyPlaying) setInterval(main, 3000); 
else setInterval(main, 1); 
// Execute as fast as possible
*/
