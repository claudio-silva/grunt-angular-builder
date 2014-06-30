/**
 * @license
 * Angular Builder's data types.
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

/* jshint unused: vars */

var util = require ('./gruntUtil')
  , extend = util.extend;

//======================================================================================================================

/**
 * Angular Builder's task options.
 *
 * Note: Middleware classes augment this class with their own options.
 */
function TaskOptions ()
{}

TaskOptions.prototype = {
  /**
   * Main module name. Only this module and its dependencies will be exported.
   * @type {string}
   */
  mainModule:             '',
  /**
   * Code packaging method.
   *
   * When false, the builder generates a single optimized javascript file with all required source code in the correct
   * loading order.
   * When true, the builder generates a set of &lt;script> tags to include all the required source files in the correct
   * loading order.
   *
   * Note: The use of this setting as an option is, probably, not what you want.
   * Use the `debug` task argument instead, as it allows using the same task target for both release and debug builds.
   * @type {boolean}
   */
  debugBuild:             false,
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
  externalModules:        '',
  /**
   * A list of framework built-in modules (ex. 'ng') that will always be appended to the `externalModules` list when
   * running tasks, so that references to them are ignored by the builder.
   * This is reserved for internal use, but could be overridden if you wish to completely replace the built-in behavior.
   * @type {string[]}
   */
  builtinModules:         ['ng'],
  /**
   * A list of modules to be excluded from the build.
   *
   * Unlike <code>externalModules</code>, which excludes each module and all of its dependencies, this option only
   * excludes the specified module from the output, not its dependencies.
   * One typical use for this is to exclude the main module from one or more build tasks.
   * @type {string[]}
   */
  excludedModules:        [],
  /**
   * A list of file paths to prepend to the build output.
   * This forces the inclusion of specific script files, independently of any source file scanning performed
   * by Grunt.
   * @type {string[]}
   */
  require:                [],
  /**
   * Allows loading third-party middleware into the middleware stack.
   * This is a task-level option. Do not specify it at target-level.
   *
   * This option allows the definition of a list of external middleware modules to load and for each one, to specify
   * where to place it on the middleware stack.
   * Each element in the list defines a module name (with the `load` property) and either the `before` or
   * `after` property with the name of a target module on the middleware stack from where to insert the loaded one
   * before or after it.
   * Note: internal middlewares are loaded into the middleware stack before the external middlewares.
   * @type {Array.<{load: string, before?: string, after?: string}>|null}
   */
  externalMiddleware:     null,
  /**
   * Defines the list of middleware bundled with angular-builder.
   * This is a task-level option. Do not specify it at target-level.
   *
   * This option sets a list of modules names to load and assemble into a middleware stack in the specified order.
   * This is reserved for internal use, but could be overridden if you wish to replace some or all of the
   * built-in behavior.
   * WARNING: the order of middleware listed here is important! If you change it, the build process may fail!
   * @type {string[]}
   * @const
   */
  internalMiddleware:     [
    './middleware/mainModuleSynthetizer',
    './middleware/analyzer',
    './middleware/sourceCodePathsExporter',
    './middleware/requiredScriptsHandler',
    './middleware/nonAngularScriptsBuilder',
    './middleware/debugBuilder',
    './middleware/releaseBuilder',
    './middleware/stylesheetReferencesHandler',
    './middleware/templateReferencesHandler',
    './middleware/assetReferencesHandler'
  ]
};

//======================================================================================================================

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

//======================================================================================================================

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

//======================================================================================================================

/**
 * The execution context for the middleware stack.
 * Contains shared information available throughout the middleware stack.
 * @constructor
 * @param grunt The Grunt API.
 * @param task The currently executing Grunt task.
 * @param {TaskOptions} defaultOptions The default values for all of the Angular Builder's options, including all
 * middleware options.
 */
function Context (grunt, task, defaultOptions)
{
  this.grunt = grunt;
  this.options = extend ({}, defaultOptions, task.options ());
  this.debugBuild = grunt.option ('build') === 'debug' ||
    (task.flags.debug === undefined ? this.options.debugBuild : task.flags.debug);
  // Clone the external modules and use it as a starting point.
  this.modules = extend ({}, this._setupExternalModules ());
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
   * @type {TaskOptions}
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

//======================================================================================================================

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

//======================================================================================================================

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

//======================================================================================================================
// EXPORT
//======================================================================================================================

module.exports = {
  ModuleDef:          ModuleDef,
  ExtensionInterface: MiddlewareInterface,
  Context:            Context,
  TaskOptions:        TaskOptions
};
