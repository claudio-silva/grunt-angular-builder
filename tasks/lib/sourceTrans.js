/**
 * @license
 * A javascript source code analysis and transformation library.
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * Licensed under the MIT license.
 */
'use strict';

var sandboxRun = require ('./sandboxRun')
  , util = require ('./util')
  , types = require ('./types');

var tokenize = util.tokenize
  , ErrorException = types.ErrorException;

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
/**
 * Regular expression string that matches a javascript identifier.
 * Note: % will be replaced by the identifier.
 * Note: this is a poor man's identifier matcher! It may fail in many situations.
 * @type {string}
 */
var MATCH_IDENTIFIER_EXP = '\\b%\\b';

//------------------------------------------------------------------------------
// PUBLIC FUNCTIONS
//------------------------------------------------------------------------------

/**
 * Searches for an angular module declaration and, if found, extracts the module's name and dependencies from it.
 * Note: if the returned 'requires' property is undefined, that means the module declaration is appending
 * definitions to a module defined elsewhere.
 * Otherwise, the module declaration is beginning the module definition.
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
 * @private
 * Optimizes the source code and also performs some checks on it, preparing it for a subsequent
 * concatenation with other files from the same module.
 * If the source is already wrapping code in a self-invoking function, it unwraps it and renames module
 * references to match a future re-wrapping.
 * Then it replaces references to angular.module(name) by a shorter form.
 * @param {ModuleDef} module
 * @param {string} source
 * @param {string} path The script's file name, for use on error messages.
 * @returns {string}
 * @throws {ErrorException}
 */
exports.optimize = function (module, source, path)
{
  /**
   * Matches the start of a declaration for the current module.
   * @type {RegExp}
   */
  var declPattern = new RegExp (
    tokenize ('angular `. module `( ["\']' + module.name + '["\'] (?:, `[[`s`S]*?`])? `)(?: ; )?'),
    'ig'
  );
  /**
   * Source code with all white space and comments removed from both ends.
   * @type {string}
   */
  var clean = source.replace (TRIM_COMMENTS_TOP, '').replace (TRIM_COMMENTS_BOTTOM, '');
  var m;

  // Check if the script already encloses code inside a self-invoking closure.
  if (m = clean.match (MATCH_MODULE_CLOSURE)) {

    // Extract the function's body and some additional information about the module and how it's being declared.
    var moduleVar = m[1]
      , closureBody = m[2]
      , moduleDecl = m[3]
      , moduleName = m[4];
    //, moduleDeps = m[5];

    if (moduleName && moduleName !== module.name)
      throw new ErrorException (false, 'Wrong module declaration: <cyan>%</cyan>', moduleName);

    // Remove the existing closure from the source code.

    var p = source.indexOf (clean);
    // Extract any comments found before the closure.
    var before = source.substr (0, p);
    // Extract any comments found after the closure.
    var after = source.substr (p + clean.length);

    source = before + closureBody + after;

    // If the angular module is being passed as a parameter to the closure, rename that parameter to the
    // predefined name.
    if (moduleVar && moduleDecl && moduleVar !== options.moduleVar) {
      if (options.renameModuleRefs)
        source = source.replace (new RegExp (sprintf (MATCH_IDENTIFIER_EXP, moduleVar), 'g'), options.moduleVar);
      else new ErrorException (false, "Module reference <cyan>%</cyan> doesn't match the configuration setting <cyan>moduleVar='%'</cyan>." +
        NL + reportErrorLocation (path) +
        info ("Either rename the variable or enable <cyan>renameModuleRefs</cyan>.")
        , moduleVar, options.moduleVar
      );
      // Continue if --force.
    }

  }
  else {
    /* The script has no self-invoking closure for module definition.
     Now check if there is code (other than a module definition) lying at a root level on the script, like,
     for instance, private functions.
     That kind of code would behave differently between a release and a debug build, as in a release build
     it will be wrapped in a self-invoking closure but, on a debug build, it will not.
     */
    grunt.log.verbose.write ("Validating " + path.cyan + '...');
    var sandbox = sandboxRun.detectInvalidSourceCode (clean);
    if (!sandbox)
    // The code passed validation.
      grunt.log.verbose.ok ();
    else {
      grunt.log.verbose.writeln ('FAILED'.yellow);
      warnAboutGlobalCode (sandbox, path);
      // If --force, continue.
    }
  }

  // Replace angular module expressions inside the closure by variable references.
  // If the module expression defines no services/whatever, remove-it, as it will be regenerated outside the closure.
  return source.replace (declPattern, function (m)
  {
    return m.substr (-1) === ')' ? options.moduleVar : '';
  });
};

