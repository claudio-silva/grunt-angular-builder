/**
 * @license
 * Custom types for use on the Grunt plugin.
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * Licensed under the MIT license.
 */
'use strict';

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
   * Name of the variable representing the angular module being defined, to be used inside self-invoked anonymous
   * functions.
   * The default value is a relatively uncommon name. You may select another if this one causes a conflict with existing
   * code.
   * @type {string}
   */
  moduleVar:        'declare',
  /**
   * When <code>true</code>, angular module references passed as arguments to self-invoking functions will be renamed to
   * <code>config.moduleVar</code>.
   *
   * When <code>false</code>, if the module reference parameter has a name that is different from the one defined on
   * <code>config.moduleVar</code>,
   * a warning will be issued and the task may stop, unless the `--force` option is specified.
   * @type {boolean}
   */
  renameModuleRefs: false,
  /**
   * When `false`, required assets are copied to the assets target folder.
   *
   * When `true`, symlinks are generated instead. This speeds up the build operation considerably, and also saves disk
   * space.
   *
   * If your operating system does not support symlinks, or if you want to archive or upload the build output, use
   * `false`.
   * @type {boolean}
   */
  symlinkAssets: false,
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
  debug:            false,
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
  externalModules:  null,
  /**
   * Indentation white space for one level.
   * You may, for instance, configure it for tabs or additional spaces.
   * @type {string}
   */
  indent: '  ',
  /**
   * This string will be appended to each module definition block.
   * Use this to increase the readability of the generated script by visually separating each module from the previous
   * one.
   * @type {string}
   */
  moduleFooter: '\n\n\n'
};

/**
 * @name FILE_GROUP_OPTIONS
 * Extended options for Grunt file groups.
 *//**
 * @name FILE_GROUP_OPTIONS#targetScript
 * @type {string}
 * Target javascript file name.
 * The javascript build output will be saved to this path.
 *
 * <b>Note:</b> when multiple filegroups target the same file, only the first one will (re)create it, all others will
 * append to it.
 *//**
 * @name FILE_GROUP_OPTIONS#targetCSS
 * @type {string}
 * Target CSS file name.
 * The packaged stylesheets will be saved to this path.
 *
 * <b>Note:</b> when multiple filegroups target the same file, only the first one will (re)create it, all others will
 * append to it.
 *//**
 * @name FILE_GROUP_OPTIONS#assetsTargetFolder
 * @type {string}
 * Target folder path for publishing assets.
 * Relative paths for the source files as specified in stylesheet asset urls are preserved on the output, so the
 * required folder structure will be recreated on the output target.
 * Urls on the exported stylesheets will be rebased to this folder.
 *//**
 * @name FILE_GROUP_OPTIONS#forceInclude
 * @type {string|string[]|null}
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
 */

/**
 * A function result composite value that includes a status value and optional data.
 * @name OperationResult
 *//**
 * Result status code. 0 = OK, other values depend on the context this is being used on.
 * @name OperationResult#status
 * @type {number}
 *//**
 * Optional output data from the function that returned this record.
 * @name OperationResult#data
 * @type {*}
 */

//------------------------------------------------------------------------------
// EXPORT
//------------------------------------------------------------------------------

module.exports = {
  ModuleDef:       ModuleDef,
  TASK_OPTIONS:    TASK_OPTIONS
};