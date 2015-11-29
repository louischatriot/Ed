

function Level(tileSize,tileTableHeight,tileTableWidth,robotRadius) {
  this.tileTableHeight=tileTableHeight; //size of the tileTable
  this.tileTableWidth=tileTableWidth;
  this.tileSize=tileSize
  this.tileTable=new Array(); //the actual maze
  this.playerTable=new Array(); //listing the players currently playing on the Level
  this.ennemyTable=new Array(); //listing the ennemies currently navigating on the level
  this.robotRadius=robotRadius;
  this.maxJumpingRadius=robotRadius*1.3; //max of the Robot radius during a jump

}


job.on('done', function(){
  console.log('The job is done!');
});

Level.prototype.addANewPlayer() {
  var newPlayer= new Robot(tileTable[0][0]); //creates a new player on the origin tile
  newPlayer.on('dead',function(){
    console.log('the player is dead');
    newPlayer.reposition(tileTable[0][0]); //reposition the player that just lost at the origin of the tileTable
    cameraX=cameraXInitial; //reset the camera
    cameraY=cameraXInitial;

  });

}

Level.prototype.createNewLevel=function() {

}
