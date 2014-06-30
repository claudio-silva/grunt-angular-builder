/**
 * Angular Builder middleware module.
 *
 * @module middleware/templateReferencesHandler
 *
 * @license
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

exports.middleware = TemplateReferencesHandlerMiddleware;
exports.options = TaskOptions;

//----------------------------------------------------------------------------------------------------------------------
// OPTIONS
//----------------------------------------------------------------------------------------------------------------------

/**
 * @constructor
 */
function TaskOptions () {}

TaskOptions.prototype = {
  /**
   * Options specific to the Template References Handler middleware.
   */
  templateReferencesHandler: {
    /**
     * The name of the Gruntfile config property to where the list of required template paths will be exported.
     * These HTML templates are those required by javascript files included in the build via build-directives.
     * @type {string}
     */
    exportToConfigProperty: 'requiredTemplates'
  }
};

//----------------------------------------------------------------------------------------------------------------------

var MATCH_DIRECTIVE = /\/\/#\s*templates?\s*\((.*?)\)/g;

/**
 * Exports the paths of all templates required by the application,
 * in the order defined by the modules' dependency graph.
 * @constructor
 * @implements {MiddlewareInterface}
 * @param {Context} context The execution context for the middleware stack.
 */
function TemplateReferencesHandlerMiddleware (context)
{
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
    scan (module.head, module.filePaths[0]);
    module.bodies.forEach (function (path, i)
    {
      scan (path, module.filePaths[i + 1]);
    });
  };

  this.build = function (targetScript)
  {
    /* jshint unused: vars */

    // Export file paths.
    context.grunt.config (context.options.templateReferencesHandler.exportToConfigProperty, paths);
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
