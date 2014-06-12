'use strict';

module.exports = NonAngularScriptsExtension;

var util = require ('../lib/gruntUtil')
  , shared = require ('../lib/sharedData');
var NL = util.NL;

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
 * @param grunt The Grunt API.
 * @param {TASK_OPTIONS} options Task configuration options.
 * @param {boolean} debugBuild Debug mode flag.
 */
function NonAngularScriptsExtension (grunt, options, debugBuild)
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
   * @param {Array.<{path: string, content: string}>} standaloneScripts
   */
  this.build = function (targetScript, standaloneScripts)
  {
    // Output the standalone scripts (if any).
    if (standaloneScripts.length) {
      if (debugBuild) {
        shared.data.prependOutput += (standaloneScripts.map (function (e)
        {
          return util.sprintf ('<script src=\"%\"></script>', e.path);
        }).join ('\\\n'));
      }
      else {
        /** @type {string[]} */
        var output = standaloneScripts.map (function (e) { return e.content; }).join (NL);

        util.writeFile (targetScript, output);
        //Note: the ensuing release/debug build step will append to the file created here.
      }
    }
  };

}
