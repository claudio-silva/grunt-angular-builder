'use strict';

module.exports = DebugBuildMiddleware;

var util = require ('../lib/gruntUtil');

/**
 * Generates a script file that inserts SCRIPT tags to the head of the html document, which will load the original
 * source scripts in the correct order. This is used on debug builds.
 * @constructor
 * @implements {MiddlewareInterface}
 * @param {Context} context The execution context for the middleware stack.
 */
function DebugBuildMiddleware (context)
{
  /** @type {string[]} */
  var traceOutput = [];

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
  this.trace = function (/*ModuleDef*/ module)
  {
    if (!context.debugBuild) return;

    var rep = context.options.rebaseDebugUrls;
    module.filePaths.forEach (function (path)
    {
      if (rep)
        for (var i = 0, m = rep.length; i < m; ++i)
          path = path.replace (rep[i].match, rep[i].replaceWith);
      traceOutput.push (util.sprintf ('<script src=\"%\"></script>', path));
    });
  };

  /**
   * @inheritDoc
   * @param {string} targetScript Path to the output script.
   */
  this.build = function (targetScript)
  {
    /* jshint unused: vars */

    if (!context.debugBuild) return;

    /** @type {string[]} */
    var output = ['document.write (\''];

    // Output standalone scripts (if any).
    output.push (context.prependOutput);

    // Output the modules (if any).
    util.arrayAppend (output, traceOutput);

    output.push ('\');');
    util.writeFile (targetScript, output.join ('\\\n'));
  };
}
