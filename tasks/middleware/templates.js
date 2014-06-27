'use strict';

var MATCH_DIRECTIVE = /\/\/#\s*templates?\s*\((.*?)\)/g;

module.exports = TemplatesMiddleware;

/**
 * Exports the paths of all templates required by the application,
 * in the order defined by the modules' dependency graph.
 * @constructor
 * @implements {MiddlewareInterface}
 * @param {Context} context The execution context for the middleware stack.
 */
function TemplatesMiddleware (context)
{
  var path = require ('path');

  /**
   * Paths of the required templates.
   * @type {string[]}
   */
  var paths = [];

  //-------------------------------------------------------------------------------------------------------------------
  // PUBLIC API
  //-------------------------------------------------------------------------------------------------------------------

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
    scan (module.head, module.filePaths[0]);
    module.bodies.forEach (function (path, i)
    {
      scan (path, module.filePaths[i + 1]);
    });
  };

  /**
   * @inheritDoc
   * @param {string} targetScript Path to the output script.
   */
  this.build = function (targetScript)
  {
    /* jshint unused: vars */

    // Export file paths.
    context.grunt.config (context.options.templatesConfigProperty, paths);
  };

  //-------------------------------------------------------------------------------------------------------------------
  // PRIVATE
  //-------------------------------------------------------------------------------------------------------------------

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
