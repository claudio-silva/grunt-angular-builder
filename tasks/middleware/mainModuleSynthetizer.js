/**
 * Angular Builder middleware module.
 *
 * @module middleware/mainModuleSynthetizer
 *
 * @license
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

//----------------------------------------------------------------------------------------------------------------------
// OPTIONS
//----------------------------------------------------------------------------------------------------------------------

/**
 * Options specific to the Main Module Synthetizer middleware.
 * @constructor
 */
function MainModuleSynthetizerOptions ()
{}

MainModuleSynthetizerOptions.prototype = {
  /**
   * A list of modules to be included in the build.
   * This allows a task to synthesize the main module's dependencies.
   * This is useful for building large applications that can have multiple alternative builds determined by the
   * user's profile or other criteria.
   *
   * This list will be set as the main module's list of required modules.
   * If it's empty, this functionality will be disabled and the build will be performed as usual.
   * If it's not empty, a synthetic main module definition will be generated for both the release and the debug
   * builds. You  must <b>not</b> declare the main module in your application or, if you do, you must exclude
   * the file that declares it from the task's source files set.
   * The reason for this is that the generated main module declaration would collide with the one on the source code.
   * You may still declare services, directives, etc. for the main module, using the
   * <code>angular.module('name')</code> syntax. You must not call the <code>module</code> method with more than one
   * argument.
   *
   * Note that, to be included in the output, the modules on this list must have their source files located somewhere
   * on the task's source paths.
   *
   * @type {string[]}
   */
  dependencies: []
};

/**
 * @mixin
 */
var MainModuleSynthetizerOptionsMixin = {
  /**
   * Options specific to the Main Module Synthetizer middleware.
   * @type {MainModuleSynthetizerOptions}
   */
  mainModuleSynthetizer: new MainModuleSynthetizerOptions ()
};

exports.options = MainModuleSynthetizerOptionsMixin;

//----------------------------------------------------------------------------------------------------------------------

exports.middleware = MainModuleSynthetizerMiddleware;

/**
 * Exports the paths of all script files that are required by the application,
 * in the order defined by the modules' dependency graph.
 * @constructor
 * @implements {MiddlewareInterface}
 * @param {Context} context The execution context for the middleware stack.
 */
function MainModuleSynthetizerMiddleware (context)
{
  /* jshint unused: vars */
  var options = context.options.mainModuleSynthetizer;

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
  };

  this.build = function (targetScript)
  {
    /* jshint unused: vars */
  };
}