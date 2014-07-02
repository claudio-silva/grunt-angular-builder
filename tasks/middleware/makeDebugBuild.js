/**
 * Angular Builder middleware module.
 *
 * @module middleware/makeDebugBuild
 *
 * @license
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

var util = require ('../lib/gruntUtil');

//----------------------------------------------------------------------------------------------------------------------
// OPTIONS
//----------------------------------------------------------------------------------------------------------------------

/**
 * Options specific to the debug builder middleware.
 * @constructor
 */
function MakeDebugBuildOptions ()
{}

MakeDebugBuildOptions.prototype = {
  /**
   * Enables the Debug Builder.
   *
   * When false, no debug build will be generated.
   * When true, the builder generates a set of &lt;script> tags to include all the required source files in the correct
   * loading order.
   *
   * Note: The use of this setting as an option is, probably, not what you want.
   * Use the `debug` task argument instead, as it allows using the same task target for both release and debug builds.
   * @type {boolean}
   */
  enabled:         false,
  /**
   * Transform the generated debug URLs of the source files. It's an array of regexp match and replace records.
   * @type {(Array.<{match:(RegExp|string),replaceWith:string}>|null)}
   */
  rebaseDebugUrls: null
};

/**
 * @mixin
 */
var MakeDebugBuildOptionsMixin = {
  /**
   * Options specific to the debug builder middleware.
   * @type {MakeDebugBuildOptions}
   */
  debugBuild: new MakeDebugBuildOptions ()
};

exports.options = MakeDebugBuildOptionsMixin;

//----------------------------------------------------------------------------------------------------------------------

exports.middleware = MakeDebugBuildMiddleware;

/**
 * Generates a script file that inserts SCRIPT tags to the head of the html document, which will load the original
 * source scripts in the correct order. This is used on debug builds.
 * @constructor
 * @implements {MiddlewareInterface}
 * @param {Context} context The execution context for the middleware stack.
 */
function MakeDebugBuildMiddleware (context)
{
  var options = context.options.debugBuild;
  /** @type {string[]} */
  var traceOutput = [];

  //--------------------------------------------------------------------------------------------------------------------
  // PUBLIC API
  //--------------------------------------------------------------------------------------------------------------------

  this.analyze = function (filesArray)
  {
    /* jshint unused: vars */
    // Do nothing
  };

  this.trace = function (/*ModuleDef*/ module)
  {
    if (!options.enabled) return;

    var rep = options.rebaseDebugUrls;
    module.filePaths.forEach (function (path)
    {
      if (rep)
        for (var i = 0, m = rep.length; i < m; ++i)
          path = path.replace (rep[i].match, rep[i].replaceWith);
      traceOutput.push (util.sprintf ('<script src=\"%\"></script>', path));
    });
  };

  this.build = function (targetScript)
  {
    /* jshint unused: vars */

    if (!options.enabled) return;

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
