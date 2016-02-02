var config = {};

if (typeof env === 'undefined') { var env = 'dev'; }

if (env === 'dev') {
  config.server = 'http://localhost:7777';
} else if (env === 'prod') {
  config.server = 'http://ed.lmt.io';
}
