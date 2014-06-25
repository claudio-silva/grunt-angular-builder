'use strict';

module.exports = AnalyzeExtension;

var util = require ('../lib/gruntUtil')
  , NL = util.NL;

/**
 * An AngularJS module source code loader and analyser.
 *
 * @constructor
 * @implements {ExtensionInterface}
 * @param {Context} context The execution context for the build pipeline.
 */
function AnalyzeExtension (context)
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

  };

}
