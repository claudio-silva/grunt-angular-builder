/**
 * @license
 * A javascript source code transformation library.
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

var sandboxRun = require ('./sandboxRun')
  , sourceExtract = require ('./sourceExtract')
  , util = require ('./gruntUtil');

var sprintf = util.sprintf;

//------------------------------------------------------------------------------
// TYPES
//------------------------------------------------------------------------------

/**
 * Error codes returned by some functions of the sourceTrans module.
 * @enum
 */
var TRANS_STAT = {
  OK:                  0,
  NO_CLOSURE_FOUND:    -1,
  RENAME_REQUIRED:     -2,
  INVALID_DECLARATION: -3
};

//------------------------------------------------------------------------------
// PRIVATE
//------------------------------------------------------------------------------

/**
 * Regular expression string that matches a javascript identifier.
 * Note: % will be replaced by the identifier.
 * Note: this is a poor man's identifier matcher! It may fail in many situations.
 * @type {string}
 */
var MATCH_IDENTIFIER_EXP = '\\b%\\b';

//------------------------------------------------------------------------------
// PUBLIC
//------------------------------------------------------------------------------

/**
 * Error codes returned by some functions of the sourceTrans module.
 * @type {TRANS_STAT}
 */
exports.TRANS_STAT = TRANS_STAT;

/**
 * Optimizes the source code and also performs some checks on it, preparing it for a subsequent
 * concatenation with other files from the same module.
 * If the source is already wrapping code in a self-invoking function, it unwraps it and renames module
 * references to match a future re-wrapping.
 * Then it replaces references to angular.module(name) by a shorter form.
 *
 * @param {string} source
 * @param {string} moduleName
 * @param {string} moduleVar
 * @returns {OperationResult} Either the optimized source code or a status code if no optimization was performed.
 */
exports.optimize = function (source, moduleName, moduleVar)
{
  /**
   * Source code with all white space and comments removed from both ends.
   * @type {string}
   */
  var clean = sourceExtract.trimComments (source);
  // Extract the function's body and some additional information about the module and how it's being declared.
  var modInfo = sourceExtract.getModuleClosureInfo (clean);

  // Check if the script already encloses code inside a self-invoking closure.
  if (modInfo) {

    // Sanity check.
    if (modInfo.moduleName && modInfo.moduleName !== moduleName)
      return /** @type {OperationResult} */ {status: TRANS_STAT.INVALID_DECLARATION, data: modInfo.moduleName};

    // Let's get that closure.
    source = sourceExtract.extractClosure (source, clean, modInfo.closureBody);

    // If the angular module is already being passed as a parameter to the closure, and that parameter has a different
    // name from the preset name for module references, rename that parameter to the predefined name.
    if (modInfo.moduleVar && modInfo.moduleDecl && modInfo.moduleVar !== moduleVar)
    // Let the caller decide what to do.
      return /** @type {OperationResult} */ {
        status: TRANS_STAT.RENAME_REQUIRED,
        data: modInfo
      };
    return /** @type {OperationResult} */ {status: TRANS_STAT.OK, data: source};
  }
  // No closure was detected.
  return /** @type {OperationResult} */ {status: TRANS_STAT.NO_CLOSURE_FOUND};
};


/**
 * The script has no self-invoking closure for a module definition.
 * Check if there is code (other than a module definition) lying at a root level on the script, like,
 * for instance, private functions.
 * That kind of code would behave differently between a release and a debug build, as in a release build
 * it will be wrapped in a self-invoking closure but, on a debug build, it will not.
 *
 * @param {string} source
 * @returns {Object|boolean} <code>True</code> if the source code is valid, otherwise an Object containing the detected
 * symbols created in the global scope.
 */
exports.validateUnwrappedCode = function (source)
{
  var sandbox = sandboxRun.detectInvalidSourceCode (source);
  return sandbox || true;
};

/**
 * Replace angular module reference expressions (with syntax <code>angular.module(...)</code>) inside the closure by
 * variable references.
 * If the module expression defines no services/whatever, remove-it, as it will be regenerated outside the closure.
 *
 * @param {ModuleDef} module
 * @param {string} source
 * @param {string} moduleVar Variable name for module references.
 * @returns {string}
 */
exports.renameModuleRefExps = function (module, source, moduleVar)
{
  /** Matches the start of a declaration for the current module.*/
  var declPattern = sourceExtract.moduleExtractionPattern (module.name);

  return source.replace (declPattern, function (m)
  {
    return m.substr (-1) === ')' ? moduleVar : '';
  });
};

/**
 * Renames angular module variable references inside the closure.
 * If the module expression defines no services/whatever, remove-it, as it will be regenerated outside the closure.
 *
 * @param {string} source
 * @param {string} oldVar Old variable name for module references.
 * @param {string} moduleVar Variable name for module references.
 * @returns {string}
 */
exports.renameModuleVariableRefs = function (source, oldVar, moduleVar)
{
  return source.replace (new RegExp (sprintf (MATCH_IDENTIFIER_EXP, oldVar), 'g'), moduleVar);
};