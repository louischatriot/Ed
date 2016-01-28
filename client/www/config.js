var env = 'prod';
var config = {};

if (typeof env === 'undefined' || env === 'dev') {
  config.server = 'http://localhost:7777';
} else if (typeof env !== 'undefined' && env === 'prod') {
  config.server = 'http://ed.lmt.io';
}
