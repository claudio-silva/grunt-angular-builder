/**
 * Angular Builder middleware module.
 *
 * @module middleware/exportSourcePaths
 *
 * @license
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

var util = require ('../lib/gruntUtil')
  , arrayAppend = util.arrayAppend;

//----------------------------------------------------------------------------------------------------------------------
// OPTIONS
//----------------------------------------------------------------------------------------------------------------------

/**
 * Options specific to the Source Code Paths Exporter middleware.
 * @constructor
 */
function ExportSourcePathsOptions ()
{}

ExportSourcePathsOptions.prototype = {
  /**
   * The name of the Gruntfile config property to where the list of required script paths will be exported.
   * These scripts are all those that are actually required by your project, including forced includes and
   * files included via build-directives.
   * @type {string}
   */
  exportToConfigProperty: 'requiredScripts'
};

/**
 * @mixin
 */
var ExportSourcePathsOptionsMixin = {
  /**
   * Options specific to the Source Code Paths Exporter middleware.
   * @type {ExportSourcePathsOptions}
   */
  sourcePaths: new ExportSourcePathsOptions ()
};

exports.options = ExportSourcePathsOptionsMixin;

//----------------------------------------------------------------------------------------------------------------------

exports.middleware = ExportSourceCodePathsMiddleware;

/**
 * Exports to Grunt's global configuration the paths of all script files that are required by the application,
 * in the order defined by the modules' dependency graph.
 * @constructor
 * @implements {MiddlewareInterface}
 * @param {Context} context The execution context for the middleware stack.
 */
function ExportSourceCodePathsMiddleware (context)
{
  var options = context.options.sourcePaths;
  /**
   * Paths of all the required files (excluding standalone scripts) in the correct loading order.
   * @type {string[]}
   */
  var tracedPaths = [];

  //--------------------------------------------------------------------------------------------------------------------
  // PUBLIC API
  //--------------------------------------------------------------------------------------------------------------------

  this.analyze = function (filesArray)
  {
    /* jshint unused: vars */
    // Do nothing
  };

  this.trace = function (module)
  {
    tracedPaths.push (module.headPath);
    arrayAppend (tracedPaths, module.bodyPaths);
  };

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

    context.grunt.config (options.exportToConfigProperty, scripts);
  };
}
