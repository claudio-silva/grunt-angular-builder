'use strict';

var MATCH_DIRECTIVE = /\/\/#\s*stylesheet\s*\((.*?)\)/g;

module.exports = StylesheetsExtension;

var util = require ('../lib/gruntUtil');

/**
 * Exports the paths of all stylesheets required by the application,
 * in the order defined by the modules' dependency graph.
 * @constructor
 * @implements {ExtensionInterface}
 * @param grunt The Grunt API.
 * @param {TASK_OPTIONS} options Task configuration options.
 * @param {boolean} debugBuild Debug mode flag.
 */
function StylesheetsExtension (grunt, options, debugBuild)
{
  /* jshint unused: vars */

  /**
   * @inheritDoc
   */
  this.trace = function (/*ModuleDef*/ module)
  {
    process (module.head);
    module.bodies.forEach (process);
  };

  /**
   * @inheritDoc
   * @param {string} targetScript Path to the output script.
   * @param {string[]} tracedPaths Paths of all the required files (excluding standalone scripts),
   * in the correct loading order.
   * @param {Array.<{path: string, content: string}>} standaloneScripts
   */
  this.build = function (targetScript, tracedPaths, standaloneScripts)
  {
  };

  function process (/*string*/ sourceCode)
  {
    var match;
    while ((match = MATCH_DIRECTIVE.exec (sourceCode))) {
      var src = match[1].split (',').map (function (s)
      {
        return s.match (/(["'])(.*?)\1/)[2];
      });

      console.log (src);
      console.log ('');
    }
  }
}
