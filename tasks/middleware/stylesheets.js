'use strict';

var MATCH_DIRECTIVE = /\/\/#\s*stylesheets?\s*\((.*?)\)/g;

module.exports = StylesheetsMiddleware;

/**
 * Exports the paths of all stylesheets required by the application,
 * in the order defined by the modules' dependency graph.
 * @constructor
 * @implements {MiddlewareInterface}
 * @param {Context} context The execution context for the build pipeline.
 */
function StylesheetsMiddleware (context)
{
  /* jshint unused: vars */

  var path = require ('path');

  /**
   * Paths of the required stylesheets.
   * @type {string[]}
   */
  var paths = [];

  /**
   * @inheritDoc
   */
  this.trace = function (/*ModuleDef*/ module)
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
    // Export file paths.
    context.grunt.config (context.options.stylesheetsConfigProperty, paths);
  };

  /**
   * Extracts file paths from embedded comment references to stylesheets and appends them to `paths`.
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
