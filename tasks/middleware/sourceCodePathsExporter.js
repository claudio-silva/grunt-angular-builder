/**
 * @license
 * Angular Builder middleware module.
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

exports.middleware = ExportSourceCodePathsMiddleware;
exports.options = TaskOptions;

//----------------------------------------------------------------------------------------------------------------------
// OPTIONS
//----------------------------------------------------------------------------------------------------------------------

function TaskOptions () {}

TaskOptions.prototype = {
  /**
   * Options specific to the Source Code Paths Exporter middleware.
   */
  sourceCodePathsExporter: {
    /**
     * The name of the Gruntfile config property to where the list of required script paths will be exported.
     * These scripts are all those that are actually required by your project, including forced includes and
     * files included via build-directives.
     * @type {string}
     */
    exportToConfigProperty: 'requiredScripts'
  }
};

//----------------------------------------------------------------------------------------------------------------------

var util = require ('../lib/gruntUtil')
  , arrayAppend = util.arrayAppend;

/**
 * Exports the paths of all script files that are required by the application,
 * in the order defined by the modules' dependency graph.
 * @constructor
 * @implements {MiddlewareInterface}
 * @param {Context} context The execution context for the middleware stack.
 */
function ExportSourceCodePathsMiddleware (context)
{
  /**
   * Paths of all the required files (excluding standalone scripts) in the correct loading order.
   * @type {string[]}
   */
  var tracedPaths = [];

  //--------------------------------------------------------------------------------------------------------------------
  // PUBLIC API
  //--------------------------------------------------------------------------------------------------------------------

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

    context.grunt.config (context.options.sourceCodePathsExporter.exportToConfigProperty, scripts);
  };
}
