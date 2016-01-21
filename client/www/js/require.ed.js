/**
 * Called require.ed to avoid confusion with Require.js (http://requirejs.org/)
 * which is not the right tool for the job (cumbersome syntax, non compatible with Node.js)
 *
 * In-browser port of the basic functionnality of Node.js' require and module.exports
 * Exposes require and module.exports global variables, to be used as in Node
 * with scripts that are ALREADY included in the webpage with a <script> tag
 *
 * It's the developer's responsibility to load scripts in the right order. This step is
 * unfortunately mandatory, the alternatives are worse:
 * * Using Require.js - see above
 * * Using document.write - no guarantee of synchronous script loading
 * * Using browserify - need to watch and rebuilt JS bundle on every change, harder debugging
 *                      since line numbers will not map
 */


this.module = { modules: {}
              , _exports: {}
              , set exports (object) {
                  var scripts = document.getElementsByTagName('script');
                  var path = scripts[scripts.length-1].getAttribute('src');
                  this._exports[path.replace(/\.js$/, '')] = object;
                }
              };


this.require = function (name) {
  var scripts = document.getElementsByTagName('script');
  var path = scripts[scripts.length-1].getAttribute('src');

  console.log('--------------------------');
  console.log(path);
  console.log(name);

  return window.module._exports[name];
};

