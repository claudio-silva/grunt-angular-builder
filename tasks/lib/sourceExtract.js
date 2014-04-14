/**
 * @license
 * A javascript source code extraction library.
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

var util = require ('./gruntUtil');

var tokenize = util.tokenize
  , sprintf = util.sprintf;

//------------------------------------------------------------------------------
// TYPES
//------------------------------------------------------------------------------

/**
 * @name ModuleClosureInfo
 * Information about a module definition enclosed in a self-calling function.
 * Source code syntax:
 * <code>
 * (function (x) {
 *   ...
 * })(angular.module(...));
 * </code>
 *//**
 * @name ModuleClosureInfo#moduleVar
 * @type {string}
 * Name of the closure parameter that receives a reference to the module.
 *//**
 * @name ModuleClosureInfo#closureBody
 * @type {string}
 * Source code inside the closure.
 *//**
 * @name ModuleClosureInfo#moduleDecl
 * @type {string}
 * Module declaration expression (<code>angular.module(...)</code>).
 *//**
 * @name ModuleClosureInfo#moduleName
 * @type {string}
 * The name of the module being declared.
 *//**
 * @name ModuleClosureInfo#moduleDeps
 * @type {string}
 * List of module dependencies.
 */

/**
 * @name ModuleHeaderInfo
 * Information parsed from a module reference with the syntax:
 * <code>angular.module('name',[])</code> or
 * <code>angular.module('name')</code>.
 *//**
 * @name ModuleHeaderInfo#status
 * @type {EXTRACT_STAT}
 * The result status.
 *//**
 * @name ModuleHeaderInfo#name
 * @type {string}
 * Module name.
 *//**
 * @name ModuleHeaderInfo#requires
 * @type {string[]|undefined}
 * List of module dependencies.
 *//**
 * @name ModuleHeaderInfo#append
 * @type {boolean}
 * If <code>false</code> this module reference is declaring the module and its dependencies.
 * If <code>true</code> this module reference is appending definitions to a module declared elsewhere.
 */

/**
 * Error codes returned by some functions of the sourceTrans module.
 * @enum
 */
var EXTRACT_STAT = {
  OK:               0,
  MULTIPLE_MODULES: -1,
  MULTIPLE_DECLS:   -2
};

//------------------------------------------------------------------------------
// PRIVATE DATA
//------------------------------------------------------------------------------

/**
 * Regular expression string that matches an angular module declaration in one of these formats:
 * angular.module('name',[dependencies]) or
 * angular.module('name')
 * @type {string}
 */
var MODULE_DECL_EXP = 'angular `. module `( ["\'](.*?)["\'] (?:, (`[[^`]]*`]))? `)';
/**
 * Regular expression string that matches javascript block/line comments.
 * @type {string}
 */
var MATCH_COMMENTS_EXP = '/`*[`s`S]*?`*/|//.*';
/**
 * Matches source code consisting only of white space and javascript comments.
 * @type {RegExp}
 */
var MATCH_NO_SCRIPT = new RegExp (tokenize (sprintf ('^ ((%) )*$', MATCH_COMMENTS_EXP)));
/**
 * Matches white space and javascript comments at the beginning of a file.
 * @type {RegExp}
 */
var TRIM_COMMENTS_TOP = new RegExp (tokenize (sprintf ('^ ((%) )*', MATCH_COMMENTS_EXP)));
/**
 * Matches white space and javascript comments at the end of a file.
 * @type {RegExp}
 */
var TRIM_COMMENTS_BOTTOM = new RegExp (tokenize (sprintf (' ((%) )*$', MATCH_COMMENTS_EXP)));
/**
 * Matches a self-invoking anonymous function that wraps all the remaining source code.
 * It assumes white space and comments have been already removed from both ends of the script.
 * It searches for one of these patterns:
 * <code>
 * (function () { ... }) ();
 * function (var) { ... }) (angular.module('name'));
 * function (var) { ... }) (angular.module('name', [dependencies]));
 * </code>
 * It also matches the following alternate self-invoking function syntax applied to any of the previous patterns:
 * <code>
 * !function () { ... } ();
 * </code>
 * @type {RegExp}
 */
var MATCH_MODULE_CLOSURE = new RegExp (tokenize (sprintf (
  '^[`(!]function `( (.+?)? `) `{ ([`s`S]*?) `} `)? `( (%)? `) ;?$', MODULE_DECL_EXP)), 'i');

//------------------------------------------------------------------------------
// PUBLIC
//------------------------------------------------------------------------------

/**
 * Error codes returned by some functions of the sourceExtract module.
 * @type {EXTRACT_STAT}
 */
exports.EXTRACT_STAT = EXTRACT_STAT;

/**
 * Searches for an angular module declaration and, if found, extracts the module's name and dependencies from it.
 * Note: if the returned 'requires' property is undefined, that means the module declaration is appending
 * definitions to a module defined elsewhere.
 * Otherwise, the module declaration is beginning the module definition.
 *
 * @param {string} source Javascript source code.
 * @returns {ModuleHeaderInfo|null} Null means the file does not contain any
 * module definition.
 */
exports.extractModuleHeader = function (source)
{
  var R = new RegExp (tokenize (MODULE_DECL_EXP), 'ig');
  var all = [], m;
  while ((m = R.exec (source)) !== null)
    all.push (m);
  // Ignore the file if it has no angular module definition.
  if (!all.length)
    return null;
  var moduleName = all[0][1]
    , headerIndex = false;
  for (var i = 0, x = all.length; i < x; ++i) {
    if (all[i][1] !== moduleName)
      return {status: EXTRACT_STAT.MULTIPLE_MODULES};
    if (all[i][2] !== undefined) {
      if (headerIndex === false)
        headerIndex = i;
      else return {status: EXTRACT_STAT.MULTIPLE_DECLS};
    }
  }
  m = all[headerIndex || 0];
  return /** @type {ModuleHeaderInfo} */ {
    status:   EXTRACT_STAT.OK,
    name:     moduleName,
    append:   headerIndex === false,
    requires: m[2] &&
        JSON.parse (m[2].replace (/\/\*[\s\S]*\*\/|\/\/.*$/gm, '').replace (/'/g, '"')) || []
  };
};

/**
 * Returns a regular expression that matches the start of a declaration for a specific module.
 * @param {string} moduleName
 * @returns {RegExp}
 */
exports.moduleExtractionPattern = function (moduleName)
{
  return new RegExp (
    tokenize ('angular `. module `( ["\']' + moduleName + '["\'] (?:, `[[`s`S]*?`])? `)(?: ; )?'),
    'ig'
  );
};

/**
 * If the give source code consists only of a module-defining closure, returns information about that closure.
 * @param {string} source
 * @returns {ModuleClosureInfo|boolean} False if no closure was found or if there is more code besides the closure.
 */
exports.getModuleClosureInfo = function (source)
{
  /** @type {Array.<string>} */
  var m;
  if ((m = source.match (MATCH_MODULE_CLOSURE))) {
    // Extract the function's body and some additional information about the module and how it's being declared.
    return /** @type {ModuleClosureInfo} */{
      moduleVar:   m[1],
      closureBody: m[2],
      moduleDecl:  m[3],
      moduleName:  m[4],
      moduleDeps:  m[5]
    };
  }
  return false;
};

/**
 * Remove the existing closure from the source code.
 * @param {string} source The original source code.
 * @param {string} clean Source code with white space and comments trimmed from both ends.
 * @param {string} closureBody The full closure source code.
 */
exports.extractClosure = function (source, clean, closureBody)
{
  var p = source.indexOf (clean);
  // Extract any comments found before the closure.
  var before = source.substr (0, p);
  // Extract any comments found after the closure.
  var after = source.substr (p + clean.length);

  return before + closureBody + after;
};

/**
 * Checks if the given source code consists only of white space and javascript comments.
 * @param {string} source
 * @returns {boolean}
 */
exports.matchWhiteSpaceOrComments = function (source)
{
  return source.match (MATCH_NO_SCRIPT) !== null;
};

/**
 * Returns the given ource code with all white space and comments removed from both ends.
 * @param {string} source
 * @returns {string}
 */
exports.trimComments = function (source)
{
  return source.replace (TRIM_COMMENTS_TOP, '').replace (TRIM_COMMENTS_BOTTOM, '');
};

