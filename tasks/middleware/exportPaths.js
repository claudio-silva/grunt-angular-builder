'use strict';

module.exports = ExportPathsMiddleware;

var util = require ('../lib/gruntUtil')
  , arrayAppend = util.arrayAppend;

/**
 * Exports the paths of all script files that are required by the application,
 * in the order defined by the modules' dependency graph.
 * @constructor
 * @implements {MiddlewareInterface}
 * @param {Context} context The execution context for the build pipeline.
 */
function ExportPathsMiddleware (context)
{
  /**
   * Paths of all the required files (excluding standalone scripts) in the correct loading order.
   * @type {string[]}
   */
  var tracedPaths = [];

  /**
   * @inheritDoc
   */
  this.analyze = function (filesArray)
  {
    /* jshint unused: vars */
    // Do nothing
  };

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
    /* jshint unused: vars */

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
