/**
 * Angular Builder middleware module.
 *
 * @module middleware/exportRequiredTemplates
 *
 * @license
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

var MATCH_DIRECTIVE = /\/\/#\s*templates?\s*\((.*?)\)/g;

//----------------------------------------------------------------------------------------------------------------------
// OPTIONS
//----------------------------------------------------------------------------------------------------------------------

/**
 * Options specific to the Template References Handler middleware.
 * @constructor
 */
function ExportRequiredTemplatesOptions ()
{}

ExportRequiredTemplatesOptions.prototype = {
  /**
   * The name of the Gruntfile config property to where the list of required template paths will be exported.
   * These HTML templates are those required by javascript files included in the build via build-directives.
   * @type {string}
   */
  exportToConfigProperty: 'requiredTemplates'
};

/**
 * @mixin
 */
var ExportRequiredTemplatesOptionsMixin = {
  /**
   * Options specific to the Template References Handler middleware.
   * @type {ExportRequiredTemplatesOptions}
   */
  requiredTemplates: new ExportRequiredTemplatesOptions ()
};

exports.options = ExportRequiredTemplatesOptionsMixin;

//----------------------------------------------------------------------------------------------------------------------

exports.middleware = ExportRequiredTemplatesMiddleware;

/**
 * Exports to Grunt's global configuration the paths of all templates required by the application,
 * in the order defined by the modules' dependency graph.
 * @constructor
 * @implements {MiddlewareInterface}
 * @param {Context} context The execution context for the middleware stack.
 */
function ExportRequiredTemplatesMiddleware (context)
{
  var options = context.options.requiredTemplates;
  var path = require ('path');

  /**
   * Paths of the required templates.
   * @type {string[]}
   */
  var paths = [];

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
    scan (module.head, module.headPath);
    module.bodies.forEach (function (path, i)
    {
      scan (path, module.bodyPaths[i]);
    });
  };

  this.build = function (targetScript)
  {
    /* jshint unused: vars */

    // Export file paths.
    context.grunt.config (options.exportToConfigProperty, paths);
  };

  //--------------------------------------------------------------------------------------------------------------------
  // PRIVATE
  //--------------------------------------------------------------------------------------------------------------------

  /**
   * Extracts file paths from embedded comment references to templates and appends them to `paths`.
   * @param {string} sourceCode
   * @param {string} filePath
   */
  function scan (sourceCode, filePath)
  {
    /* jshint -W083 */
    var match;
    while ((match = MATCH_DIRECTIVE.exec (sourceCode))) {
      match[1].split (',').forEach (function (s)
      {
        var url = s.match (/(["'])(.*?)\1/)[2];
        paths.push (path.normalize (path.dirname (filePath) + '/' + url));
      });
    }
  }

}
