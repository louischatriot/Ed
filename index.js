var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/client/www/index.html');
});

var playerTable = new Array();
for (var i = 0; i < 10; i++) {
  playerTable.push({playerID:i, occupied: false, inGameWith: 0});
}
var waitingPlayer = 0; //0 is the empty ID
var waitingLevel;


function findFirstAvailableID(table) {
  var l = table.length;
  for (var i = 1; i < l; i++) {
    if (!table[i].occupied) {
      table[i].occupied = true;
      return i;
    }
  }
  return 0;
}


// TODO: add error handler on socket
io.on('connection', function(socket){
  var i = findFirstAvailableID(playerTable);
  console.log("a user just connected. ID: " + i);
  socket.join(i);
  socket.playerID = i;
  io.sockets.in(i).emit('playerID',i);

  socket.on('ping', function(data){
    if (data.playerID !== 0 ) { io.sockets.in(data.playerID).emit('pong');}
  });

  socket.on('disconnect', function(){
    console.log('user disconnected: ' + socket.playerID);
    var player = playerTable[socket.playerID];
    player.occupied = false;
    if (player.inGameWith !== 0) {
      //stop the game
      io.sockets.in(player.inGameWith).emit('endGame');
    }
  });

  socket.on('readyToPlay', function (data) {
    console.log('readyToPlay: ' + socket.playerID);
    if (waitingPlayer === 0) {
      waitingPlayer = socket.playerID;
      waitingLevel = data.level;
    }
    else {
      //start a game
      console.log("game is starting");
      playerTable[socket.playerID].inGameWith = waitingPlayer;
      playerTable[waitingPlayer].inGameWith = socket.playerID;
      io.sockets.in(socket.playerID).emit('startGame',{ level: waitingLevel });
      io.sockets.in(waitingPlayer).emit('startGame',{ level: waitingLevel });
      waitingPlayer = 0;
    }
  });

  socket.on('startAJump', function(data){
    console.log('startAJump');
    if (playerTable[socket.playerID].inGameWith !== 0) {
      console.log('sendingJumpInfo to: ' + playerTable[socket.playerID].inGameWith);
      io.sockets.in(playerTable[socket.playerID].inGameWith).emit('startAJum', { pingPong: data.pingPong});
    }
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
