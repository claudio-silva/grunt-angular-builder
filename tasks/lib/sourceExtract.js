/**
 * @license
 * A javascript source code extraction library.
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * Licensed under the MIT license.
 */
'use strict';

var util = require ('./util');

var tokenize = util.tokenize;

//------------------------------------------------------------------------------
// TYPES
//------------------------------------------------------------------------------

/**
 * Information about a module-defining closure.
 * @typedef {{
 *   moduleVar:   string,
 *   closureBody: string,
 *   moduleDecl:  string,
 *   moduleName:  string,
 *   moduleDeps:  string
 * }}
 */
var ModuleClosureInfo;

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
 * Regular expression that matches an angular module declaration.
 * @see MODULE_DECL_EXP
 * @type {RegExp}
 */
var MATCH_MODULE_DECL = new RegExp (tokenize (MODULE_DECL_EXP), 'i');
/**
 * Regular expression string that matches javascript block/line comments.
 * @type {string}
 */
var MATCH_COMMENTS_EXP = '/`*[`s`S]*?`*/|//.*';
/**
 * Matches source code consisting only of white space and javascript comments.
 * @type {RegExp}
 */
var MATCH_NO_SCRIPT = new RegExp (tokenize ('^ ((' + MATCH_COMMENTS_EXP + ') )*$'));
/**
 * Matches white space and javascript comments at the beginning of a file.
 * @type {RegExp}
 */
var TRIM_COMMENTS_TOP = new RegExp (tokenize ('^ ((' + MATCH_COMMENTS_EXP + ') )*'));
/**
 * Matches white space and javascript comments at the end of a file.
 * @type {RegExp}
 */
var TRIM_COMMENTS_BOTTOM = new RegExp (tokenize (' ((' + MATCH_COMMENTS_EXP + ') )*$'));
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
var MATCH_MODULE_CLOSURE = new RegExp (tokenize ('^[`(!]function `( (.+?)? `) `{ ([`s`S]*?) `} `)? `( (' + MODULE_DECL_EXP + ')? `) ;?$'), 'i');

//------------------------------------------------------------------------------
// PUBLIC FUNCTIONS
//------------------------------------------------------------------------------

/**
 * Searches for an angular module declaration and, if found, extracts the module's name and dependencies from it.
 * Note: if the returned 'requires' property is undefined, that means the module declaration is appending
 * definitions to a module defined elsewhere.
 * Otherwise, the module declaration is beginning the module definition.
 *
 * @param {string} source Javascript source code.
 * @returns {{name: *, requires: Array.<string>|undefined, append: boolean}|null} Null means the file does not contain any
 * module definition.
 */
exports.extractModuleHeader = function (source)
{
  var m = source.match (MATCH_MODULE_DECL);
  // Ignore the file if it has no angular module definition.
  if (!m)
    return null;
  return {
    name:     m[1],
    append:   !m[2],
    requires: m[2] && JSON.parse (m[2].replace (/'/g, '"')) || []
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
  if (m = source.match (MATCH_MODULE_CLOSURE)) {
    // Extract the function's body and some additional information about the module and how it's being declared.
    return {
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
exports.extractClosure = function (source, clean, closureBody) {
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

