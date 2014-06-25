'use strict';

module.exports = NonAngularScriptsExtension;

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
 * @implements {ExtensionInterface}
 * @param {Context} context The execution context for the build pipeline.
 */
function NonAngularScriptsExtension (context)
{
  /**
   * @inheritDoc
   */
  this.trace = function (module)
  {
    /* jshint unused: vars */
    // Do nothing
  };

  /**
   * @inheritDoc
   * @param {string} targetScript Path to the output script.
   */
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
