/**
 * A javascript source code extraction library.
 *
 * @module lib/sourceExtract
 *
 * @license
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
 * Name of the closure parameter that receives a reference to the module.
 * @type {string}
 *//**
 * @name ModuleClosureInfo#closureBody
 * Source code inside the closure.
 * @type {string}
 *//**
 * @name ModuleClosureInfo#moduleDecl
 * Module declaration expression (<code>angular.module(...)</code>).
 * @type {string}
 *//**
 * @name ModuleClosureInfo#moduleName
 * The name of the module being declared.
 * @type {string}
 *//**
 * @name ModuleClosureInfo#moduleDeps
 * List of module dependencies.
 * @type {string}
 */

/**
 * @name ModuleHeaderInfo
 * Information parsed from a module reference with the syntax:
 * <code>angular.module('name',[])</code> or
 * <code>angular.module('name')</code>.
 *//**
 * @name ModuleHeaderInfo#name
 * Module name.
 * @type {string}
 *//**
 * @name ModuleHeaderInfo#requires
 * List of module dependencies.
 * @type {string[]|undefined}
 *//**
 * @name ModuleHeaderInfo#append
 * If <code>false</code> this module reference is declaring the module and its dependencies.
 * If <code>true</code> this module reference is appending definitions to a module declared elsewhere.
 * @type {boolean}
 *//**
 * @name ModuleHeaderInfo#configFn
 * Third parameter of a module declaration, if present.
 * @type {string|undefined}
 */

//------------------------------------------------------------------------------
// PRIVATE DATA
//------------------------------------------------------------------------------

/**
 * Matches a comment block preceding a module definition.
 * This allows excluding module definitions thar lie inside comment blocks.
 * It is assumed that opening comments are always placed at the beginning od a line, eventually preceded by white space.
 * This allows avoiding false positives with expressions like the one below:
 * //# template("skins/*.html")
 * @type {string}
 */
var MATCH_LEADING_COMMENT = '(?:^|`s+)/`*(?:(?!`*/)[`s`S])*$';
/**
 * Regular expression string that matches an angular module declaration in one of these formats:
 * angular.module('name',[dependencies]) or
 * angular.module('name')
 * @type {string}
 */
var MODULE_DECL_EXP = 'angular `. module `( ["\'](.*?)["\'] (?:, (`[[^`]]*`]))? (,[`s`S]+)?`)';
/**
 * Regular expression string that matches the start of a declaration for a specific module.
 * <MOD> is replaced by the module name being extracted before the RegExp is compiled.
 * This also captures whether there is a variable assignment preceding the module declaration.
 * @type {string}
 */
var MODULE_EXTR_EXP = '(= )?angular `. module `( ["\']<MOD>["\'] (?:, `[[`s`S]*?`])? (,[`s`S]+)?`)( ; )?';
/**
 * Regular expression string that matches javascript block/line comments.
 * @type {string}
 */
var MATCH_COMMENTS_EXP = '(`/`*[`s`S]*?`*`/|`/`/.*)';
/**
 * Matches source code consisting only of white space and javascript comments.
 * @type {RegExp}
 */
var MATCH_NO_SCRIPT = new RegExp (tokenize (sprintf ('^ (% )*$', MATCH_COMMENTS_EXP)));
/**
 * Allows the removal of /* block comments and // line comments to ensure JSON.parse() success.
 * @type {RegExp}
 */
var MATCH_COMMENT_BLOCKS = /\/\*[\s\S]*?\*\/|\/\/.*$|/gm;
/**
 * Allows the removal of trailing commas to ensure JSON.parse() success.
 * @type {RegExp}
 */
var MATCH_LAST_COMMA = /,(?=\s*\]$)/;
/**
 * Matches white space and javascript comments at the beginning of a file.
 * @type {RegExp}
 */
var TRIM_COMMENTS_TOP = new RegExp (tokenize (sprintf ('^ (% )*', MATCH_COMMENTS_EXP)));
/**
 * Matches white space and javascript comments at the end of a file.
 * @type {RegExp}
 */
//Note: max.limit of 3 prevents infinite matching and thread lockup.
var TRIM_COMMENTS_BOTTOM = new RegExp (tokenize (sprintf (' (% ){0,3}$', MATCH_COMMENTS_EXP)));
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
 * Searches for angular module declarations and, if found, extracts each module's name and dependencies from them.
 *
 * @param {string} source Javascript source code.
 * @returns {ModuleHeaderInfo[]} Module information.
 */
exports.extractModuleHeaders = function (source)
{
  var LEADING_COMMENT = 0
    , MODULE_NAME = 1
    , MODULE_DEPS = 2
    , CONFIG_FN = 3;
  var R = new RegExp (tokenize (MODULE_DECL_EXP), 'ig');
  var R2 = new RegExp (tokenize (MATCH_LEADING_COMMENT));
  var all = [], m, m2, prec, lastI = 0;

  // Collect all matches but exclude declarations inside comment blocks.
  while ((m = R.exec (source)) !== null) {
    prec = source.substring (lastI, m.index);
    m2 = R2.exec (prec);
    if (!m2 || m2[LEADING_COMMENT].match (/\*\//))
      all.push (m);
    lastI = R.lastIndex;
  }

  // Ignore the file if it has no angular module definition.
  if (!all.length)
    return [];

  /* @type {ModuleHeaderInfo[]} */
  var modules = [];
  var lastAppend = null, name;

  for (var i = 0, x = all.length; i < x; ++i) {
    name = all[i][MODULE_NAME];
    if (all[i][MODULE_DEPS] !== undefined)
      modules.push ({
        name:     name,
        append:   false,
        requires: all[i][MODULE_DEPS] &&
                    JSON.parse (all[i][MODULE_DEPS]
                        .replace (MATCH_COMMENT_BLOCKS, '').replace (MATCH_LAST_COMMA, '').replace (/'/g, '"')
                    ) || [],
        configFn: all[i][CONFIG_FN]
      });
    else {
      if (lastAppend && lastAppend !== name)
        throw 'Appending definitions to several modules in the same file is not allowed.' + util.NL +
          'Started with module <cyan>' + lastAppend + '</cyan> and later switched to <cyan>' + name + '</cyan>.';
      lastAppend = name;
      modules.push ({
        name:   name,
        append: true
      });
    }
  }
  return modules;
};

/**
 * Returns a regular expression that matches the start of a declaration for a specific module.
 * @param {string} moduleName
 * @returns {RegExp}
 */
exports.moduleExtractionPattern = function (moduleName)
{
  return new RegExp (tokenize (MODULE_EXTR_EXP.replace ('<MOD>', moduleName), 'ig'));
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

