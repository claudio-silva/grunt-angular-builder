/**
 * Angular Builder middleware module.
 *
 * @module middleware/nonAngularScriptsBuilder
 *
 * @license
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

exports.middleware = NonAngularScriptsBuilderMiddleware;

var util = require ('../lib/gruntUtil')
  , NL = util.NL;

/**
 * Builds non-angular-module scripts.
 *
 * On release builds, this extension saves all non-module script files required by the application into a
 * single output file, in the correct loading order.
 *
 * On debug builds, it appends SCRIPT tags to the head of the html document, which will load the original
 * source scripts in the correct order.
 *
 * @constructor
 * @implements {MiddlewareInterface}
 * @param {Context} context The execution context for the middleware stack.
 */
function NonAngularScriptsBuilderMiddleware (context)
{
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
    /* jshint unused: vars */
    // Do nothing
  };

  this.build = function (targetScript)
  {
    // Output the standalone scripts (if any).
    if (context.standaloneScripts.length) {
      if (context.debugBuild) {
        context.prependOutput += (context.standaloneScripts.map (function (e)
        {
          return util.sprintf ('<script src=\"%\"></script>', e.path);
        }).join ('\\\n'));
      }
      else {
        /** @type {string[]} */
        var output = context.standaloneScripts.map (function (e) { return e.content; }).join (NL);

        util.writeFile (targetScript, output);
        //Note: the ensuing release/debug build step will append to the file created here.
      }
    }
  };

}
