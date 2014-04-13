'use strict';

module.exports = ExportPathsAddOn;

var util = require ('../lib/gruntUtil')
  , arrayAppend = util.arrayAppend;

/**
 * Exports the paths of all script files that are required by the application,
 * in the order defined by the modules' dependency graph.
 * @constructor
 * @implements {AddOnInterface}
 * @param grunt The Grunt API.
 * @param {TASK_OPTIONS} options Task configuration options.
 * @param {boolean} debugBuild Debug mode flag.
 */
function ExportPathsAddOn (grunt, options, debugBuild)
{
  /* jshint unused: vars */

  /**
   * @inheritDoc
   */
  this.trace = function (module) {};

  /**
   * @inheritDoc
   * @param {string} targetScript Path to the output script.
   * @param {string[]} tracedPaths Paths of all the required files (excluding standalone scripts),
   * in the correct loading order.
   * @param {Array.<{path: string, content: string}>} standaloneScripts
   */
  this.build = function (targetScript, tracedPaths, standaloneScripts)
  {
    var scripts = [];

    // Include paths of forced-include scripts.

    if (standaloneScripts.length)
      arrayAppend (scripts, standaloneScripts.map (function (e)
      {
        return e.path;
      }));

    // Include all module files.

    arrayAppend (scripts, tracedPaths);

    // Export.

    grunt.config (options.scriptsConfigProperty, scripts);
  };
}