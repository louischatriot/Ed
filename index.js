var http = require('http')
  , express = require('express')
  , app = express()
  , server = http.Server(app)
  , fs = require('fs')
  , path = require('path')
  , config = require('./lib/config')
  , games = require('./lib/games')
  ;

// Splash screen and favicon
app.get('/favicon.ico', function (req, res) { return res.sendFile(path.join(process.cwd(), "assets/img/favicon.ico")); });
app.get('/', function (req, res) { return res.render("main.jade"); });


// Game files. config is modified on the fly to point to production
app.get('/game/config.js', function (req, res) {
  // Maybe implement a cache as config will not be modified often
  fs.readFile('client/www/config.js', 'utf8', function (err, contents) {
    if (err) { return res.status(500).send("Error retrieving client configuration"); }
    return res.send("var env='prod';" + contents);;
  });
});

app.get('/game/*', function (req, res) {
  if (req.url === "/game/") { req.url += "index.html"; }
  return res.sendFile(path.join(process.cwd(), "client/www", req.url.replace(/\/game\//, '')));
});

app.get('/game', function (req, res) { return res.redirect(302, '/game/'); });


function globalHandler (req, res) {
  if (req.url === "/favicon.ico") {
    res.writeHead(200);
    return res.end();
  }

  res.writeHead(200, {'Content-Type': 'text/plain'});
  return res.end('Hello World this is Ed\n');
}


// Don't let an unhandled crash stop the application
process.on('uncaughtException', function (err) {
  console.log('Caught an uncaught exception, I should probably send an email or something');
  console.log(err);
  if (err.stack) { console.log(err.stack); }
});

// Tie socket.io to our HTTP server and launch it
require('./lib/realtime').initialize(server);
server.listen(config.serverPort);
