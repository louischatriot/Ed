var env = process.env.GOP_ENV || 'dev'
  , config = {}
  ;

// Common options
config.env = env;
config.serverPort = 7777;
config.pingFrequency = 1000;   // Time between two pings in ms

// Environment specific options
switch (env) {
  case 'prod':
    config.host = 'TBD';
    break;

  case 'dev':
  default:
    config.host = 'http://localhost:7777';
    break;
}

// Interface
module.exports = config;
