/**
 * Angular Builder middleware module.
 *
 * @module middleware/buildForeignScripts
 * @requires module:middleware/makeDebugBuild
 * @requires module:middleware/makeReleaseBuild
 *
 * @license
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

exports.middleware = BuildForeignScriptsMiddleware;

var util = require ('../lib/gruntUtil')
  , path = require ('path')
  , NL = util.NL
  , MATCH_PATH_SEP = new RegExp (util.escapeRegExp(path.sep), 'g');

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
function BuildForeignScriptsMiddleware (context)
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

      // Debug Build

      if (context.options.debugBuild && context.options.debugBuild.enabled) {
        var rep = context.options.debugBuild.rebaseDebugUrls;
        context.prependOutput += (context.standaloneScripts.map (function (e)
        {
          var path = e.path.replace (MATCH_PATH_SEP, '/'); // Convert file paths to URLs.
          if (rep)
            for (var i = 0, m = rep.length; i < m; ++i)
              path = path.replace (rep[i].match, rep[i].replaceWith);
          if (path) // Ignore empty path; it means that this middleware should not output a script tag.
            return util.sprintf ('<script src=\"%\"></script>', path);
          return '';
        })
          .filter (function (x) {return x;}) // Remove empty paths.
          .join ('\\\n'));
      }

      // Release Build

      else if (context.options.releaseBuild && context.options.releaseBuild.enabled) {
        /** @type {string[]} */
        var output = context.standaloneScripts.map (function (e) { return e.content; }).join (NL);

        util.writeFile (targetScript, output);
        //Note: the ensuing release/debug build step will append to the file created here.
      }
    }
  };

}
