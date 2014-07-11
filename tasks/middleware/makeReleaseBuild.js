/**
 * Angular Builder middleware module.
 *
 * @module middleware/makeReleaseBuild
 *
 * @license
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

var util = require ('../lib/gruntUtil')
  , types = require ('../lib/types')
  , sourceTrans = require ('../lib/sourceTrans')
  , sourceExtract = require ('../lib/sourceExtract');

var indent = util.indent
  , sprintf = util.sprintf
  , csprintf = util.csprintf
  , writeln = util.writeln
  , warn = util.warn
  , getExplanation = util.getExplanation
  , reportErrorLocation = util.reportErrorLocation
  , NL = util.NL
  , ContextEvent = types.ContextEvent;

/**
 * Error codes returned by some functions in this module.
 * @enum
 */
var STAT = {
  OK:       0,
  INDENTED: 1
};

//----------------------------------------------------------------------------------------------------------------------
// OPTIONS
//----------------------------------------------------------------------------------------------------------------------

/**
 * Options specific to the release builder middleware.
 * @constructor
 */
function MakeReleaseBuildOptions ()
{}

MakeReleaseBuildOptions.prototype = {
  /**
   * Enables the Release Builder.
   *
   * When false, no release build will be generated.
   * When true, the builder generates a single optimized javascript file with all required source code in the correct
   * loading order.
   *
   * Note: The use of this setting as an option is, probably, not what you want.
   * Use the `debug` task argument instead, as it allows using the same task target for both release and debug builds.
   * @type {boolean}
   */
  enabled:          true,
  /**
   * Name of the variable representing the angular module being defined, to be used inside self-invoked anonymous
   * functions.
   * You may select another identifier if the default one causes a conflict with existing code.
   * @type {string}
   */
  moduleVar:        'module',
  /**
   * When <code>true</code>, angular module references passed as arguments to self-invoking functions will be
   * renamed to <code>config.moduleVar</code>.
   *
   * When <code>false</code>, if the module reference parameter has a name that is different from the one defined on
   * <code>config.moduleVar</code>, a warning will be issued and the task may stop, unless the `--force` option is
   * specified.
   * @type {boolean}
   */
  renameModuleRefs: false,
  /**
   * Indentation white space for one level.
   * You may, for instance, configure it for tabs or additional spaces.
   * @type {string}
   */
  indent:           '  ',
  /**
   * This string will be appended to each module definition block.
   * Use this to increase the readability of the generated script by visually separating each module from the previous
   * one.
   * @type {string}
   */
  moduleFooter:     NL + NL + NL
};

/**
 * @mixin
 */
var MakeReleaseBuildOptionsMixin = {
  /**
   * Options specific to the release builder middleware.
   * @type {MakeReleaseBuildOptions}
   */
  releaseBuild: new MakeReleaseBuildOptions ()
};

exports.options = MakeReleaseBuildOptionsMixin;

//----------------------------------------------------------------------------------------------------------------------

exports.middleware = MakeReleaseBuildMiddleware;

/**
 * Saves all script files required by the specified module into a single output file, in the correct
 * loading order. This is used on release builds.
 * @constructor
 * @implements {MiddlewareInterface}
 * @param {Context} context The execution context for the middleware stack.
 */
function MakeReleaseBuildMiddleware (context)
{
  var options = context.options.releaseBuild;
  /**
   * <code>true</code> if the task is running in verbose mode.
   * @type {boolean}
   */
  var verbose = context.grunt.option ('verbose');
  /**
   * Grunt's verbose output API.
   * @type {Object}
   */
  var verboseOut = context.grunt.log.verbose;
  /** @type {string[]} */
  var traceOutput = [];

  //--------------------------------------------------------------------------------------------------------------------
  // EVENTS
  //--------------------------------------------------------------------------------------------------------------------

  context.listen (ContextEvent.ON_AFTER_ANALYZE, function ()
  {
    if (options.enabled)
      writeln ('Generating the <cyan>release</cyan> build...');
  });

  //--------------------------------------------------------------------------------------------------------------------
  // PUBLIC API
  //--------------------------------------------------------------------------------------------------------------------

  this.analyze = function (filesArray)
  {
    /* jshint unused: vars */
    // Do nothing
  };

  this.trace = function (/*ModuleDef*/ module)
  {
    if (!options.enabled) return;

    // Fist process the head module declaration.
    if (!module.head)
      return util.warn ('Module <cyan>%</cyan> has no declaration.', module.name);
    var head = optimize (module.head, module.filePaths[0], module);

    // Prevent the creation of an empty (or comments-only) self-invoking function.
    // In that case, the head content will be output without a wrapping closure.
    if (!module.bodies.length && sourceExtract.matchWhiteSpaceOrComments (head.data)) {
      // Output the comments (if any).
      if (head.data.trim ())
        traceOutput.push (head.data);
      // Output a module declaration with no definitions.
      traceOutput.push (sprintf ('angular.module (\'%\', %);%', module.name,
          util.toQuotedList (module.requires), options.moduleFooter)
      );
    }
    // Enclose the module contents in a self-invoking function which receives the module instance as an argument.
    else {
      // Begin closure.
      traceOutput.push ('(function (' + options.moduleVar + ') {\n');
      // Insert module declaration.
      traceOutput.push (conditionalIndent (head));
      // Insert additional module definitions.
      for (var i = 0, m = module.bodies.length; i < m; ++i) {
        var body = optimize (module.bodies[i], module.filePaths[i + 1], module);
        traceOutput.push (conditionalIndent (body));
      }
      // End closure.
      traceOutput.push (sprintf ('\n}) (angular.module (\'%\', %%));%', module.name,
        util.toQuotedList (module.requires), module.configFn || '', options.moduleFooter));
    }
  };

  this.build = function (targetScript)
  {
    if (!options.enabled) return;

    util.writeFile (targetScript, traceOutput.join (NL));
  };

  //--------------------------------------------------------------------------------------------------------------------
  // PRIVATE
  //--------------------------------------------------------------------------------------------------------------------

  /**
   * Calls sourceTrans.optimize() and handles the result.
   *
   * @param {string} source
   * @param {string} path For error messages.
   * @param {ModuleDef} module
   * @returns {OperationResult} The transformed source code.
   * @throws Error Sanity check.
   */
  function optimize (source, path, module)
  {
    var result = sourceTrans.optimize (source, module.name, options.moduleVar);
    var stat = sourceTrans.TRANS_STAT;
    switch (result.status) {

      case stat.OK:

        //----------------------------------------------------------
        // Module already enclosed in a closure with no arguments.
        //----------------------------------------------------------
        return /** @type {OperationResult} */ {
          status: STAT.INDENTED,
          data:   sourceTrans.renameModuleRefExps (module, options.indent + result.data, options.moduleVar)
        };


      case stat.NO_CLOSURE_FOUND:

        //----------------------------------------------------------
        // Unwrapped source code.
        // It must be validated to make sure it's safe.
        //----------------------------------------------------------
        verboseOut.write ('Validating ' + path.cyan + '...');
        var valid = sourceTrans.validateUnwrappedCode (source);
        if (valid)
        // The code passed validation.
          verboseOut.ok ();
        else {
          verboseOut.writeln ('FAILED'.yellow);
          warnAboutGlobalCode (valid, path);
          // If --force, continue.
        }
        // Either the code is valid or --force was used, so process it.
        return /** @type {OperationResult} */ {
          status: STAT.OK,
          data:   sourceTrans.renameModuleRefExps (module, source, options.moduleVar)
        };


      case stat.RENAME_REQUIRED:

        //----------------------------------------------------------
        // Module already enclosed in a closure, with its reference
        // passed in as the function's argument.
        //----------------------------------------------------------
        /** @type {ModuleClosureInfo} */
        var modInfo = result.data;
        if (!options.renameModuleRefs) {
          warn ('The module variable reference <cyan>%</cyan> doesn\'t match the preset name on the config setting ' +
              '<cyan>moduleVar=\'%\'</cyan>.%%%',
            modInfo.moduleVar, options.moduleVar, NL, reportErrorLocation (path),
            getExplanation ('Either rename the variable or enable <cyan>renameModuleRefs</cyan>.')
          );
          // If --force, continue.
        }
        return /** @type {OperationResult} */ {
          status: STAT.OK,
          data:   sourceTrans.renameModuleVariableRefs (modInfo.closureBody, modInfo.moduleVar, options.moduleVar)
        };


      case stat.INVALID_DECLARATION:

        warn ('Wrong module declaration: <cyan>%</cyan>', result.data);
        // If --force, continue.
        break;


      default:
        throw new Error ('Optimize failed. It returned ' + JSON.stringify (result));
    }
    // Optimization failed. Return the unaltered source code.
    return /** @type {OperationResult} */ {status: STAT.OK, data: source};
  }

  /**
   * Returns the given text indented unless it was already indented.
   * @param {OperationResult} result
   * @return {string}
   */
  function conditionalIndent (result)
  {
    return result.status === STAT.INDENTED ? result.data : indent (result.data, 1, options.indent);
  }

  /**
   * Isses a warning about problematic code found on the global scope.
   * @param {Object} sandbox
   * @param {string} path
   */
  function warnAboutGlobalCode (sandbox, path)
  {
    var msg = csprintf ('yellow', 'Incompatible code found on the global scope!'.red + NL +
        reportErrorLocation (path) +
        getExplanation (
            'This kind of code will behave differently between release and debug builds.' + NL +
            'You should wrap it in a self-invoking function and/or assign global variables/functions ' +
            'directly to the window object.'
        )
    );
    if (verbose) {
      var found = false;
      util.forEachProperty (sandbox, function (k, v)
      {
        if (!found) {
          found = true;
          msg += '  Detected globals:'.yellow + NL;
        }
        msg += (typeof v === 'function' ? '    function '.blue : '    var      '.blue) + k.cyan + NL;
      });
    }
    warn (msg + '>>'.yellow);
  }
}
