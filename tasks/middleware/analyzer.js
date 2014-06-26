'use strict';

module.exports = AnalyzerMiddleware;

/**
 * An AngularJS module source code loader and analyser.
 *
 * @constructor
 * @implements {MiddlewareInterface}
 * @param {Context} context The execution context for the build pipeline.
 */
function AnalyzerMiddleware (context)
{
  context = context; //disable warning

  /**
   * @inheritDoc
   * @param {GruntFilesArrayExt} filesArray The set of source code files to be processed.
   */
  this.analyze = function (filesArray)
  {
    /* jshint unused: vars */
    // Do nothing
  };

  /**
   * @inheritDoc
   * @param {ModuleDef} module Gives you access to the module's metadata and its source code.
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
    /* jshint unused: vars */
    // Do nothing
  };

}
