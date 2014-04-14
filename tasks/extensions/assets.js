'use strict';

module.exports = AssetsExtension;

var util = require ('../lib/gruntUtil');

/**
 * Exports the assets required by the application's modules.
 * @constructor
 * @implements {ExtensionInterface}
 * @param grunt The Grunt API.
 * @param {TASK_OPTIONS} options Task configuration options.
 * @param {boolean} debugBuild Debug mode flag.
 */
function AssetsExtension (grunt, options, debugBuild)
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
   * @param {Array.<{path: string, content: string}>} standaloneScripts
   */
  this.build = function (targetScript, standaloneScripts)
  {
  };
}
