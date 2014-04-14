'use strict';

module.exports = ExportPathsExtension;

var util = require ('../lib/gruntUtil')
  , arrayAppend = util.arrayAppend;

/**
 * Exports the paths of all script files that are required by the application,
 * in the order defined by the modules' dependency graph.
 * @constructor
 * @implements {ExtensionInterface}
 * @param grunt The Grunt API.
 * @param {TASK_OPTIONS} options Task configuration options.
 * @param {boolean} debugBuild Debug mode flag.
 */
function ExportPathsExtension (grunt, options, debugBuild)
{
  /* jshint unused: vars */

  /**
   * Paths of all the required files (excluding standalone scripts) in the correct loading order.
   * @type {string[]}
   */
  var tracedPaths = [];

  /**
   * @inheritDoc
   */
  this.trace = function (module)
  {
    arrayAppend (tracedPaths, module.filePaths);
  };

  /**
   * @inheritDoc
   * @param {string} targetScript Path to the output script.
   * @param {Array.<{path: string, content: string}>} standaloneScripts
   */
  this.build = function (targetScript, standaloneScripts)
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
