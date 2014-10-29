/**
 * Angular Builder middleware module.
 *
 * @module middleware/overrideDependencies
 *
 * @license
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

var util = require ('../lib/gruntUtil')
  , types = require ('../lib/types');

var ModuleDef = types.ModuleDef
  , sprintf = util.sprintf;

//----------------------------------------------------------------------------------------------------------------------
// OPTIONS
//----------------------------------------------------------------------------------------------------------------------

/**
 * Options specific to the Main Module Synthetizer middleware.
 * @constructor
 */
function OverrideDependenciesOptions ()
{}

OverrideDependenciesOptions.prototype = {
  /**
   * A list of modules to be included in the build.
   * This allows a task to synthesize the main module's dependencies.
   * This is useful for building large applications that can have multiple alternative builds determined by the
   * user's profile or other criteria.
   *
   * This list will be set as the main module's list of required modules.
   * If it's empty, this functionality will be disabled and the build will be performed as usual.
   * If it's not empty, a synthetic main module definition will be generated for both the release and the debug
   * builds. You must <b>not</b> declare the main module in your application or, if you do, you must exclude
   * the file that declares it from the task's source files set.
   * The reason for this is that the generated main module declaration would collide with the one on the source code.
   * You may still declare services, directives, etc. for the main module, using the
   * <code>angular.module('name')</code> syntax, but you must not call the <code>module</code> method with more than one
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
var OverrideDependenciesOptionsMixin = {
  /**
   * Options specific to the Override Dependencies middleware.
   * @type {OverrideDependenciesOptions}
   */
  overrideDependencies: new OverrideDependenciesOptions ()
};

exports.options = OverrideDependenciesOptionsMixin;

//----------------------------------------------------------------------------------------------------------------------

exports.middleware = OverrideDependenciesMiddleware;

/**
 * Allows the setting of the main module's dependencies via Grunt configuration options and synthetizes that module's
 * declaration javascript code.
 * @constructor
 * @implements {MiddlewareInterface}
 * @param {Context} context The execution context for the middleware stack.
 */
function OverrideDependenciesMiddleware (context)
{
  /* jshint unused: vars */
  var options = context.options.overrideDependencies
    , enabled = options.dependencies && options.dependencies.length;

  //--------------------------------------------------------------------------------------------------------------------
  // PUBLIC API
  //--------------------------------------------------------------------------------------------------------------------

  this.analyze = function (filesArray)
  {
    /* jshint unused: vars */
    if (!enabled) return;

    var mainModuleName = context.options.mainModule;
    var mainModule = context.modules[mainModuleName] = new ModuleDef (mainModuleName);
    mainModule.requires = options.dependencies;
    // Must set head to a non-empty string to mark the module as being initialized.
    mainModule.head = ' ';
  };

  this.trace = function (module)
  {
    /* jshint unused: vars */
  };

  this.build = function (targetScript)
  {
    /* jshint unused: vars */
    if (!enabled) return;

    if (context.options.debugBuild && context.options.debugBuild.enabled) {
      var declaration = sprintf ("angular.module('%',%);",
        context.options.mainModule,
        util.toQuotedList (options.dependencies)
      );
      context.appendOutput += sprintf ('<script>%</script>', declaration);
    }
  };
}
