/**
 * @license
 * Custom types for use on the Grunt plugin.
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

/* jshint unused: vars */

var NL = require ('./gruntUtil').NL
  , nodeUtil = require ('util');

/**
 * A module definition record.
 * Contains all javascript defining the module, read from one or more source files.
 * @constructor
 */
function ModuleDef ()
{
  this.bodies = [];
  this.filePaths = [];
}

ModuleDef.prototype = {
  /**
   * The module's name.
   * @type {!string}
   */
  name:      '',
  /**
   * Relative file paths to the source script files.
   * The first entry corresponds to the file that starts the module definition.
   * @type {string[]}
   */
  filePaths: null,
  /**
   * The content of the file that starts the module definition.
   * If null, the file was not yet read.
   * @type {?string}
   */
  head:      null,
  /**
   * The content of each additional file that appends definitions to the module.
   * If there are no additional files for the module, the value will be an empty array.
   * @type {string[]}
   */
  bodies:    null,
  /**
   * List with the names of the required modules.
   * If no modules are required, the value will be an empty array.
   * @type {string[]}
   */
  requires:  null,
  /**
   * When true, the module is not included in the build but it's possibly referenced in the source code.
   * @type {boolean}
   */
  external:  false,
  /**
   * @type {string|undefined}
   * Third parameter of a module declaration, if present.
   */
  configFn:  undefined
};

/**
 * @const
 * Defaults for task options.
 */
var TASK_OPTIONS = {
  /**
   * Main module name. Only this module and its dependencies will be exported.
   * @type {string}
   */
  main:                      '',
  /**
   * Name of the variable representing the angular module being defined, to be used inside self-invoked anonymous
   * functions.
   * You may select another identifier if the default one causes a conflict with existing code.
   * @type {string}
   */
  moduleVar:                 'module',
  /**
   * When <code>true</code>, angular module references passed as arguments to self-invoking functions will be renamed to
   * <code>config.moduleVar</code>.
   *
   * When <code>false</code>, if the module reference parameter has a name that is different from the one defined on
   * <code>config.moduleVar</code>, a warning will be issued and the task may stop, unless the `--force` option is
   * specified.
   * @type {boolean}
   */
  renameModuleRefs:          false,
  /**
   * When `false`, required assets are copied to the assets target directory.
   *
   * When `true`, symlinks are generated instead. This speeds up the build operation considerably, and also saves disk
   * space.
   *
   * If your operating system does not support symlinks, or if you want to archive or upload the build output, use
   * `false`.
   * @type {boolean}
   */
  symlinkAssets:             true,
  /**
   * Set to `true` to enable the assets builder.
   * @type {boolean}
   */
  buildAssets:               false,
  /**
   * Directory path that will be used as the reference point from where relative asset urls are calculated.
   * This determines where assets are exported to.
   * If you specify a relative path, it is resolved from the current filegroup's destination folder.
   * @type {string}
   */
  assetsTargetDir:           '',
  /**
   * Code packaging method.
   *
   * When false, generates a single optimized javascript file with all required source code in the correct
   * loading order.
   *
   * When true, generates a set of &lt;script> tags to include all the required source files in the correct
   * loading order.
   *
   * Note: The use of this setting as an option is, probably, not what you want.
   * Use the `debug` task argument instead.
   * @type {boolean}
   */
  debug:                     false,
  /**
   * A list of module names to ignore when building.
   * This allows the source code to contain references to modules not present in the build (ex. 3rd party libraries that
   * are loaded independently).
   *
   * If a module reference (for module access or for declaring a dependency) is found in the source code, which targets
   * a module that is not declared anywhere in the build's source files, the build operation aborts when that module
   * name is not present on this list.
   * @type {string|string[]}
   */
  externalModules:           '',
  /**
   * A list of framework built-in modules (ex. 'ng') that will always be appended to the `externalModules` list when
   * running tasks, so that references to them are ignored by the builder.
   * This is reserved for internal use, but could be overridden if you wish to completely replace the built-in behavior.
   * @type {string[]}
   */
  builtinModules:            ['ng'],
  /**
   * A list of modules to be excluded from the build.
   *
   * Unlike <code>externalModules</code>, which excludes each module and all of its dependencies, this option only
   * excludes the specified module from the output, not its dependencies.
   * One typical use for this is to exclude the main module from one or more build tasks.
   * @type {string[]}
   */
  excludedModules:           [],
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
   * You may still declare services, directives, etc. for the main module, using the <code>angular.module('name')</code>
   * syntax. You must not call the <code>module</code> method with more than one argument.
   *
   * Note that, to be included in the output, the modules on this list must have their source files located somewhere
   * on the task's source paths.
   *
   * @type {string[]}
   */
  mainModuleDependencies:    [],
  /**
   * A list of file paths to prepend to the build output.
   * This forces the inclusion of specific script files, independently of any source file scanning performed
   * by Grunt.
   * @type {string[]}
   */
  require:                   [],
  /**
   * Indentation white space for one level.
   * You may, for instance, configure it for tabs or additional spaces.
   * @type {string}
   */
  indent:                    '  ',
  /**
   * This string will be appended to each module definition block.
   * Use this to increase the readability of the generated script by visually separating each module from the previous
   * one.
   * @type {string}
   */
  moduleFooter:              NL + NL + NL,
  /**
   * Transform the generated debug URLs of the source files. It's an array of regexp match and replace records.
   * @type {{match:RegExp|string,replaceWith:string}[]|null}
   */
  rebaseDebugUrls:           null,
  /**
   * The name of the Gruntfile config property to where the list of required stylesheet paths will be exported.
   * These stylesheets are those required by javascript files included in the build via build-directives.
   * @type {string}
   */
  stylesheetsConfigProperty: 'requiredStylesheets',
  /**
   * The name of the Gruntfile config property to where the list of required template paths will be exported.
   * These HTML templates are those required by javascript files included in the build via build-directives.
   * @type {string}
   */
  templatesConfigProperty:   'requiredTemplates',
  /**
   * The name of the Gruntfile config property to where the list of required script paths will be exported.
   * These scripts are all those that are actually required by your project, including forced includes and
   * files included via build-directives.
   * @type {string}
   */
  scriptsConfigProperty:     'requiredScripts',
  /**
   * Allows loading 3rd party middlewares into the middleware stack.
   *
   * This option may define a list of external middleware modules to load and for each one, specify where
   * to place it on the middleware stack.
   * Each element in the list defines a module name (with the `load` property) and either the `before` or
   * `after` property with the name of a target module on the middleware stack from where to insert the loaded one
   * before or after it.
   * Note: internal middlewares are loaded into the middleware stack before the external middlewares.
   * @type {Array.<{load: string, before?: string, after?: string}>|null}
   */
  externalMiddleware:        null,
  /**
   * Defines the list of middleware bundled with angular-builder.
   * This is a list of modules names to load and assemble into a middleware stack in the specified order.
   * This is reserved for internal use, but could be overridden if you wish to replace some or all of the
   * built-in behavior.
   * WARNING: the order of middleware listed here is important! If you change it, the build process may fail!
   * @type {string[]}
   * @const
   */
  internalMiddleware:        [
    './middleware/analyzer',
    './middleware/exportPaths',
    './middleware/scripts',
    './middleware/nonAngularScripts',
    './middleware/debugBuild',
    './middleware/releaseBuild',
    './middleware/stylesheets',
    './middleware/templates',
    './middleware/assets'
  ]
};

/**
 * A Grunt files array with extended options.
 * @interface
 */
function GruntFilesArrayExt ()
{}

GruntFilesArrayExt.prototype = {
  /**
   * @type {string[]|null}
   */
  src:          null,
  /**
   * @type {string|null}
   */
  dest:         null,
  /**
   * A list of filenames or glob patterns that specify which javascript files should always be included in the build,
   * even if they have no module declarations.
   *
   * <b>Warning:</b> the files must also be matched by <code>src</code> to be included.
   *
   * <b>Note:</b> patterns without slashes will match against the basename of the path even if it contains slashes,
   * eg. pattern <code>*.js</code> will match filepath <code>path/to/file.js</code>.
   *
   * Usually, when a script file is found in the set of source files which doesn't contain a module declaration,
   * that file is ignored.
   * But, if the file name and path matches a file name or glob pattern specified here, it will still be included.
   *
   * Non-module files are output in the same order they were read, and <b>before</b> any module.
   *
   * <b>Tip:</b> You can append the current step's result script to another one that resulted from a previous build
   * step.
   * If you specify a target or file group exclusively for standalone script files and append the result to other built
   * files, you will have more control on the order of the assembled files.
   *
   *  @type {string|string[]|null}
   */
  forceInclude: null

};

/**
 * API for an Angular Builder middleware plugin.
 * Defines handlers for the three stages of the build process: analyze --> trace --> build.
 *
 * Note: implementing classes must have a compatible constructor.
 *
 * @interface
 * @param {Context} context The execution context for the middleware stack.
 */
function MiddlewareInterface (context)
{}

MiddlewareInterface.prototype = {
  /**
   * Load and analyze the specified source files.
   * Invoked once.
   *
   * @param {GruntFilesArrayExt} filesArray The set of source code files to be processed.
   */
  analyze: function (filesArray) {},
  /**
   * Scan a module for relevant information.
   * Invoked once for each required module in the application, in the order defined by the dependency graph.
   * Each module, in turn, is passed trough all the middlewares on the stack.
   *
   * Note: external and excluded modules are never traced; dependencies of excluded modules may be traced.
   *
   * @param {ModuleDef} module Gives you access to the module's metadata and its source code.
   */
  trace:   function (module) {},
  /**
   * Build the compilation output.
   * Invoked once.
   *
   * @param {string} targetScript Path to the output script.
   */
  build:   function (targetScript) {}
};

/**
 * The execution context for the middleware stack.
 * Contains shared information available throughout the middleware stack.
 * @constructor
 * @param grunt The Grunt API.
 * @param task The currently executing Grunt task.
 */
function Context (grunt, task)
{
  this.grunt = grunt;
  this.options = task.options (TASK_OPTIONS);
  this.debugBuild = grunt.option ('build') === 'debug' ||
    (task.flags.debug === undefined ? this.options.debug : task.flags.debug);
  // Clone the external modules and use it as a starting point.
  this.modules = nodeUtil._extend ({}, this._setupExternalModules ());
  // Reset tracer.
  this.loaded = {};
  // Reset the scripts list to a clone of the `require` option or to an empty list.
  this.standaloneScripts = (this.options.require || []).slice ();
  this.shared = {};
}

Context.prototype = {
  /**
   * The Grunt API.
   */
  grunt:                 null,
  /**
   * Task-specific options set on the Gruntfile.
   * @type {TASK_OPTIONS}
   */
  options:               null,
  /**
   * Is this a debug build?
   * Note: the debug build mode can be set via three different settings.
   * @type {boolean}
   */
  debugBuild:            false,
  /**
   * A map of module names to module definition records.
   * @type {Object.<string, ModuleDef>}
   */
  modules:               null,
  /**
   * A map of module names to boolean values that registers which modules were already
   * emmited to/ referenced on the output.
   * @type {Object.<string,boolean>}
   */
  loaded:                null,
  /**
   * A list of scripts that have no module definitions but still are forced to being included in the build.
   * Each item contains the filename and the file content.
   * @type {Array.<{path: string, content: string}>}
   */
  standaloneScripts:     null,
  /**
   * Source code to be prepended to the build output file.
   * @type {string}
   */
  prependOutput:         '',
  /**
   * Custom data shared between extensions.
   */
  shared:                null,
  /**
   * Registers the configured external modules so that they can be ignored during the build output generation.
   * @returns {Object.<string, ModuleDef>}
   * @private
   */
  _setupExternalModules: function ()
  {
    /** @type {Object.<string, ModuleDef>} */
    var modules = {};
    ((typeof this.options.externalModules === 'string' ?
      [this.options.externalModules] : this.options.externalModules
      ) || []).
      concat (this.options.builtinModules).
      forEach (function (moduleName)
    {
      // Ignore redundant names.
      if (!modules[moduleName]) {
        /** @type {ModuleDef} */
        var module = modules[moduleName] = new ModuleDef ();
        module.name = moduleName;
        module.external = true;
      }
    });
    return modules;
  }

};

/**
 * A function result composite value that includes a status value and optional data.
 * @name OperationResult
 *//**
 * Result status code. 0 = OK, other values depend on the context this is being used on.
 * @name OperationResult#status
 * @type {number}
 */
/**
 * Optional output data from the function that returned this record.
 * @name OperationResult#data
 * @type {*}
 */

//------------------------------------------------------------------------------
// EXPORT
//------------------------------------------------------------------------------

module.exports = {
  ModuleDef:          ModuleDef,
  ExtensionInterface: MiddlewareInterface,
  Context:            Context,
  TASK_OPTIONS:       TASK_OPTIONS
};
