'use strict';

module.exports = ExportPathsExtension;

var util = require ('../lib/gruntUtil')
  , arrayAppend = util.arrayAppend;

/**
 * Exports the paths of all script files that are required by the application,
 * in the order defined by the modules' dependency graph.
 * @constructor
 * @implements {ExtensionInterface}
 * @param {Context} context The execution context for the build pipeline.
 */
function ExportPathsExtension (context)
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
   */
  this.build = function (targetScript)
  {
    var scripts = [];

    // Include paths of forced-include scripts.

    if (context.standaloneScripts.length)
      arrayAppend (scripts, context.standaloneScripts.map (function (e)
      {
        return e.path;
      }));

    // Include all module files.

    arrayAppend (scripts, tracedPaths);

    // Export.

    context.grunt.config (context.options.scriptsConfigProperty, scripts);
  };
}
