'use strict';

module.exports = TemplatesExtension;

var util = require ('../lib/gruntUtil');

/**
 * Exports the paths of all templates required by the application,
 * in the order defined by the modules' dependency graph.
 * @constructor
 * @implements {ExtensionInterface}
 * @param grunt The Grunt API.
 * @param {TASK_OPTIONS} options Task configuration options.
 * @param {boolean} debugBuild Debug mode flag.
 */
function TemplatesExtension (grunt, options, debugBuild)
{
  /* jshint unused: vars */

  /**
   * @inheritDoc
   */
  this.trace = function (module)
  {
    // Do nothing.
  };

  /**
   * @inheritDoc
   * @param {string} targetScript Path to the output script.
   * @param {string[]} tracedPaths Paths of all the required files (excluding standalone scripts),
   * in the correct loading order.
   * @param {Array.<{path: string, content: string}>} standaloneScripts
   */
  this.build = function (targetScript, tracedPaths, standaloneScripts)
  {
  };
}
