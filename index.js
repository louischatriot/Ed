var http = require('http')
  , app = http.createServer(globalHandler)
  , config = require('./lib/config')
  , games = require('./lib/games')
  ;

function globalHandler (req, res) {
  if (req.url === "/favicon.ico") {
    res.writeHead(200);
    return res.end();
  }

  res.writeHead(200, {'Content-Type': 'text/plain'});
  return res.end('Hello World this is Ed the last robot game\n');
}


// Don't let an unhandled crash stop the application
process.on('uncaughtException', function (err) {
  console.log('Caught an uncaught exception, I should probably send an email or something');
  console.log(err);
  if (err.stack) { console.log(err.stack); }
});

// Tie socket.io to our HTTP server and launch it
require('./lib/realtime').initialize(app);
app.listen(config.serverPort);
