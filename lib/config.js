var env = process.env.ED_ENV || 'dev'
  , config = {}
  ;

// Common options
config.env = env;
config.serverPort = 7777;
config.numberOfPlayers = 2;   // Will need to be more specific
config.startGameAfter = 2000;   // Delay between game creation on server and game start on clients

// Environment specific options
switch (env) {
  case 'prod':
    config.host = 'http://ed.lmt.io';
    config.pingFrequency = 1000;   // Time between two pings in ms
    break;

  case 'dev':
  default:
    config.host = 'http://localhost:7777';
    config.pingFrequency = 100;   // Time between two pings in ms
    break;
}

// Interface
module.exports = config;
