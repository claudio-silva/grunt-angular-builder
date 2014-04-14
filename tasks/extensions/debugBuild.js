'use strict';

module.exports = DebugBuildExtension;

var util = require ('../lib/gruntUtil');

/**
 * Generates a script file that inserts SCRIPT tags to the head of the html document, which will load the original
 * source scripts in the correct order. This is used on debug builds.
 * @constructor
 * @implements {ExtensionInterface}
 * @param grunt The Grunt API.
 * @param {TASK_OPTIONS} options Task configuration options.
 * @param {boolean} debugBuild Debug mode flag.
 */
function DebugBuildExtension (grunt, options, debugBuild)
{
  /** @type {string[]} */
  var traceOutput = [];

  /**
   * @inheritDoc
   */
  this.trace = function (module)
  {
    if (!debugBuild) return;

    var rep = options.rebaseDebugUrls;
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
   * @param {Array.<{path: string, content: string}>} standaloneScripts
   */
  this.build = function (targetScript, standaloneScripts)
  {
    if (!debugBuild) return;

    /** @type {string[]} */
    var output = ['document.write (\''];

    // Output the standalone scripts (if any).
    if (standaloneScripts.length)
      output.push (standaloneScripts.map (function (e)
      {
        return util.sprintf ('<script src=\"%\"></script>', e.path);
      }).join ('\\\n'));

    // Output the modules (if any).
    util.arrayAppend (output, traceOutput);

    output.push ('\');');
    util.writeFile (targetScript, output.join ('\\\n'));
  };
}
