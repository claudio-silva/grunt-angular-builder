/**
 * @license
 * A javascript source code transformation library.
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * Licensed under the MIT license.
 */
'use strict';

var sandboxRun = require ('./sandboxRun')
  , types = require ('./types')
  , sourceExtract = require ('./sourceExtract')
  , gruntUtil = require ('./gruntUtil')
  , util = require ('./util');

var ErrorException = types.ErrorException
  , sprintf = util.sprintf
  , NL = util.NL
  , info = gruntUtil.info
  , reportErrorLocation = gruntUtil.reportErrorLocation;

//------------------------------------------------------------------------------
// PRIVATE DATA
//------------------------------------------------------------------------------

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
 * Optimizes the source code and also performs some checks on it, preparing it for a subsequent
 * concatenation with other files from the same module.
 * If the source is already wrapping code in a self-invoking function, it unwraps it and renames module
 * references to match a future re-wrapping.
 * Then it replaces references to angular.module(name) by a shorter form.
 *
 * @param {ModuleDef} module
 * @param {string} source
 * @param {string} path The script's file name, for use on error messages.
 * @returns {string}
 * @throws {ErrorException}
 */
exports.optimize = function (module, source, path, moduleVar, renameModuleRefs, onValidation)
{
  /** Matches the start of a declaration for the current module.*/
  var declPattern = sourceExtract.moduleExtractionPattern (module.name);
  /**
   * Source code with all white space and comments removed from both ends.
   * @type {string}
   */
  var clean = sourceExtract.trimComments (source);
  // Extract the function's body and some additional information about the module and how it's being declared.
  var modInfo = sourceExtract.extractModuleClosure (clean);

  // Check if the script already encloses code inside a self-invoking closure.
  if (modInfo) {

    if (modInfo.moduleName && modInfo.moduleName !== module.name)
      throw new ErrorException (false, 'Wrong module declaration: <cyan>%</cyan>', modInfo.moduleName);

    // Remove the existing closure from the source code.

    var p = source.indexOf (clean);
    // Extract any comments found before the closure.
    var before = source.substr (0, p);
    // Extract any comments found after the closure.
    var after = source.substr (p + clean.length);

    source = before + modInfo.closureBody + after;

    // If the angular module is being passed as a parameter to the closure, rename that parameter to the
    // predefined name.
    if (modInfo.moduleVar && modInfo.moduleDecl && modInfo.moduleVar !== moduleVar) {
      if (renameModuleRefs)
        source = source.replace (new RegExp (sprintf (MATCH_IDENTIFIER_EXP, moduleVar), 'g'), moduleVar);
      else new ErrorException (false, "Module reference <cyan>%</cyan> doesn't match the configuration setting <cyan>moduleVar='%'</cyan>." +
        NL + reportErrorLocation (path) +
        info ("Either rename the variable or enable <cyan>renameModuleRefs</cyan>.")
        , modInfo.moduleVar, moduleVar
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
    var sandbox = sandboxRun.detectInvalidSourceCode (clean);
    onValidation (!sandbox, sandbox);
  }

  // Replace angular module expressions inside the closure by variable references.
  // If the module expression defines no services/whatever, remove-it, as it will be regenerated outside the closure.
  return source.replace (declPattern, function (m)
  {
    return m.substr (-1) === ')' ? moduleVar : '';
  });
};

