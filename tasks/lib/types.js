/**
 * @license
 * Custom types for use on the Grunt plugin.
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * Licensed under the MIT license.
 */
'use strict';

/**
 * A result that includes a status value and optional data.
 * @typedef {{status: number, data:*}}
 */
var OperationResult;

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
   * @type {string}
   */
  name:      '',
  /**
   * Relative file paths to the source script files.
   * The first entry corresponds to the file that starts the module definition.
   * @type {Array.<string>}
   */
  filePaths: null,
  /**
   * The content of the file that starts the module definition.
   * If null, the file was not yet read.
   * @type {String|null}
   */
  head:      null,
  /**
   * The content of each additional file that appends definitions to the module.
   * If there are no additional files for the module, the value will be an empty array.
   * @type {Array.<String>}
   */
  bodies:    null,
  /**
   * List with the names of the required modules.
   * If no modules are required, the value will be an empty array.
   * @type {Array.<String>}
   */
  requires:  null,
  /**
   * When true, the module is not included in the build but it's possibly referenced in the source code.
   */
  external:  false
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
  main:             '',
  /**
   * Name of the variable representing the angular module being defined, to be used inside self-invoked anonymous functions.
   * The default value is a relatively uncommon name. You may select another if this one causes a conflict with existing code.
   * @type {string}
   */
  moduleVar:        'declare',
  /**
   * When <code>true</code>, angular module references passed as arguments to self-invoking functions will be renamed to <code>config.moduleVar</code>.
   *
   * When <code>false</code>, if the module reference parameter has a name that is different from the one defined on <code>config.moduleVar</code>,
   * a warning will be issued and the task may stop.
   * @type {boolean}
   */
  renameModuleRefs: false,
  /**
   * Code packaging method.
   * When false, generates a single optimized javascript file with all required source code in the correct loading order.
   * When true, generates a set of &lt;script> tags to include all the required source files in the correct loading order.
   * Note: The use of this setting as an option is, probably, not what you want.
   * Use the `debug` task argument instead.
   * @type {boolean}
   */
  debug:            false,
  /**
   * A list of module names to ignore when building.
   * This allows the source code to contain references to modules not present in the build (ex. 3rd party libraries that are loaded independently).
   *
   * If a module reference (for module access or for declaring a dependency) is found in the source code, which targets a module that is not declared anywhere in the build's source files, the build operation aborts when that module name is not present on this list.
   * @type {Array.<string>}
   */
  externalModules:  null,
  /**
   * This string will be appended to each module definition block.
   */
  moduleFooter: '\n\n\n'
};

/**
 * Extended options for Grunt file groups.
 */
var FILE_GROUP_OPTIONS = {
  /**
   * Target javascript file name.
   * The javascript build output will be saved to this path.
   *
   * <b>Note:</b> when multiple filegroups target the same file, only the first one will (re)create it, all others will append to it.
   * @type {string}
   */
  targetScript:       '',
  /**
   * Target CSS file name.
   * The packaged stylesheets will be saved to this path.
   *
   * <b>Note:</b> when multiple filegroups target the same file, only the first one will (re)create it, all others will append to it.
   * @type {string}
   */
  targetCSS:          '',
  /**
   * Target folder path for publishing assets.
   * Relative paths for the source files as specified in stylesheet asset urls are preserved on the output, so the required folder structure will be recreated on the output target.
   * Urls on the exported stylesheets will be rebased to this folder.
   * @type {string}
   */
  assetsTargetFolder: '',
  /**
   * A list of filenames or glob patterns that specify which javascript files should always be included in the build, even if they have no module declarations.
   *
   * <b>Warning:</b> the files must also be matched by <code>src</code> to be included.
   *
   * <b>Note:</b> patterns without slashes will match against the basename of the path even if it contains slashes, eg. pattern <code>*.js</code> will match filepath <code>path/to/file.js</code>.
   *
   * Usually, when a script file is found in the set of source files which doesn't contain a module declaration, that file is ignored.
   * But, if the file name and path matches a file name or glob pattern specified here, it will still be included.
   *
   * Non-module files are output in the same order they were read, and <b>before</b> any module.
   *
   * <b>Tip:</b> You can append the current step's result script to another one that resulted from a previous build step.
   * If you specify a target or file group exclusively for standalone script files and append the result to other built files, you will have more control on the order of the assembled files.
   * @type {string|Array.<string>|null}
   */
  forceInclude:       null
};

//------------------------------------------------------------------------------
// EXPORT
//------------------------------------------------------------------------------

module.exports = {
  OperationResult: OperationResult,
  ModuleDef:       ModuleDef,
  TASK_OPTIONS:    TASK_OPTIONS
};