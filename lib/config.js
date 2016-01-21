var env = process.env.GOP_ENV || 'dev'
  , config = {}
  ;

// Common options
config.env = env;
config.serverPort = 7777;

// Environment specific options
switch (env) {
  case 'prod':
    config.host = 'TBD';
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
