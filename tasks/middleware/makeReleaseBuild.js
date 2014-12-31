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

var util          = require ('../lib/gruntUtil')
  , types         = require ('../lib/types')
  , sourceTrans   = require ('../lib/sourceTrans')
  , sourceExtract = require ('../lib/sourceExtract');

var indent              = util.indent
  , sprintf             = util.sprintf
  , csprintf            = util.csprintf
  , writeln             = util.writeln
  , warn                = util.warn
  , getExplanation      = util.getExplanation
  , reportErrorLocation = util.reportErrorLocation
  , NL                  = util.NL
  , ContextEvent        = types.ContextEvent;

/**
 * Error codes returned by some functions in this module.
 * @enum
 */
var STAT = {
  OK:       0,
  INDENTED: 1
};

var LINE = '\
//--------------------------------------------------------------------------------------------------------------------';

var LINE2 = '\
//====================================================================================================================';

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
  enabled:           true,
  /**
   * Name of the variable representing the angular module being defined, to be used inside self-invoked anonymous
   * functions.
   * You may select another identifier if the default one causes a conflict with existing code.
   * @type {string}
   */
  moduleVar:         'module',
  /**
   * When <code>true</code>, angular module references passed as arguments to self-invoking functions will be
   * renamed to <code>config.moduleVar</code>.
   *
   * When <code>false</code>, if the module reference parameter has a name that is different from the one defined on
   * <code>config.moduleVar</code>, a warning will be issued and the task may stop, unless the `--force` option is
   * specified.
   * @type {boolean}
   */
  renameModuleRefs:  false,
  /**
   * Indentation white space for one level.
   * You may, for instance, configure it for tabs or additional spaces.
   * @type {string}
   */
  indent:            '  ',
  /**
   * This string will be appended to each module definition block.
   * Use this to increase the readability of the generated script by visually separating each module from the previous
   * one.
   * @type {string}
   */
  moduleFooter:      NL + NL + NL,
  /**
   * When true, for each module being output, a comment with the module's name is prepended to it.
   * @type {boolean}
   */
  outputModuleNames: false,
  /**
   * When true, for each file being output, a comment with the file's name is prepended to it.
   * @type {boolean}
   */
  outputFileNames:   false
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
    if (options.enabled) {
      var space = context.verbose ? NL : '';
      writeln ('%Generating the <cyan>release</cyan> build...%', space, space);
      scanForOptimization (context);
    }
  });

  context.listen (ContextEvent.ON_BEFORE_DEPS, function (/*ModuleDef*/ module)
  {
    if (options.enabled) {
      if (module.nonOptimizedContainer)
        traceOutput.push ('(function () {\n');
    }
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

    if (module.nonOptimizedContainer)
      traceOutput.push ('\n}) ();');

    // Fist process the head module declaration.
    if (!module.head)
      return util.warn ('Module <cyan>%</cyan> has no declaration.', module.name);

    var headPath = module.headPath;

    var head, headWasOutput = context.outputtedFiles[headPath];
    if (!headWasOutput) {
      head = module.optimize ?
        optimize (module.head, headPath, module)
        : {status: STAT.INDENTED, data: module.head};
      context.outputtedFiles[headPath] = true;
    }

    var isEmpty = headWasOutput ? true : sourceExtract.matchWhiteSpaceOrComments (head.data);

    outputModuleHeader (module, headWasOutput, headPath);

    if (!headWasOutput) {
      // Prevent the creation of an empty (or comments-only) self-invoking function.
      // In that case, the head content will be output without a wrapping closure.
      if (!module.bodies.length && isEmpty) {
        // Output the comments (if any).
        if (head.data.trim ())
          traceOutput.push (head.data);
        // Output a module declaration with no definitions.
        traceOutput.push (sprintf ('angular.module (\'%\', %);%', module.name,
            util.toQuotedList (module.requires), options.moduleFooter)
        );
        return;
      }
    }

    // Enclose the module contents in a self-invoking function which receives the module instance as an argument.
    if (module.optimize)
    // Begin closure.
      traceOutput.push ('(function (' + options.moduleVar + ') {\n');

    // Insert module declaration.
    if (!headWasOutput)
      traceOutput.push (conditionalIndent (head));

    outputModuleDefinitions (module, headWasOutput);

    // End closure.
    if (module.optimize)
      traceOutput.push (sprintf ('\n}) (angular.module (\'%\', %%));%', module.name,
        util.toQuotedList (module.requires), module.configFn || '', options.moduleFooter));
  };

  this.build = function (targetScript)
  {
    if (!options.enabled) return;

    if (context.prependOutput)
      traceOutput.unshift (context.prependOutput);
    if (context.appendOutput)
      traceOutput.push (context.appendOutput);

    util.writeFile (targetScript, traceOutput.join (NL));
  };

  //--------------------------------------------------------------------------------------------------------------------
  // PRIVATE
  //--------------------------------------------------------------------------------------------------------------------

  /**
   * Outputs a module information header.
   *
   * @param {ModuleDef} module
   * @param {boolean} headWasOutput
   * @param {string} headPath
   */
  function outputModuleHeader (module, headWasOutput, headPath)
  {
    if (module.bodies.length || !headWasOutput) {
      traceOutput.push (LINE2, '// Module:    ' + module.name, '// Optimized: ' + (module.optimize ? 'Yes' : 'No'));
      if (!headWasOutput)
        traceOutput.push ('// File:      ' + headPath);
      else {
        for (var i = 0, m = module.bodies.length; i < m; ++i) {
          var bodyPath = module.bodyPaths[i];
          // Find first body who's corresponding file was not yet output.
          if (!context.outputtedFiles[bodyPath]) {
            traceOutput.push ('// File:      ' + bodyPath);
            break;
          }
        }
      }
      traceOutput.push (LINE2, '');
    }
  }

  /**
   * Insert additional module definitions.
   *
   * @param {ModuleDef} module
   * @param {boolean} headWasOutput
   */
  function outputModuleDefinitions (module, headWasOutput)
  {
    for (var i = 0, m = module.bodies.length; i < m; ++i) {
      var bodyPath = module.bodyPaths[i];
      if (!bodyPath)
        console.log (module.name, i, module.bodies.length, module.bodyPaths);
      // Skip bodies who's corresponding file was already output.
      if (context.outputtedFiles[bodyPath])
        continue;
      context.outputtedFiles[bodyPath] = true;

      var body = module.optimize ?
        optimize (module.bodies[i], bodyPath, module)
        : {status: STAT.INDENTED, data: module.bodies[i]};

      if (i || !headWasOutput)
        traceOutput.push (LINE, '// File: ' + bodyPath, LINE, '');
      traceOutput.push (conditionalIndent (body));
    }
  }

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
        if (path)
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
      (path ? reportErrorLocation (path) : '') +
      getExplanation (
        'This kind of code will behave differently between release and debug builds.' + NL +
        'You should wrap it in a self-invoking function and/or assign global variables/functions ' +
        'directly to the window object.'
      )
    );
    if (context.verbose) {
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

/**
 * Determine which modules can be optimized.
 * @param {Context} context The execution context for the middleware stack.
 */
function scanForOptimization (context)
{
  var module, verboseOut = context.grunt.log.verbose;

  // Track repeated files to determine which modules can be optimized.

  Object.keys (context.modules).forEach (function (name)
  {
    if (context.modules.hasOwnProperty (name)) {
      module = context.modules[name];
      if (!module.external)
        module.filePaths ().forEach (function (path)
        {
          if (!context.filesRefCount[path])
            context.filesRefCount[path] = 1;
          else {
            verboseOut.writeln (util.csprintf ('white',
              'Not optimizing <cyan>%</cyan> because it shares some/all of its files with other modules.', name));
            ++context.filesRefCount[path];
            module.optimize = false;
          }
        });
    }
  });

  // Determine which modules can act as containers for non-optimized sections of code.

  scan (context.options.mainModule, true);

  /**
   * Search for unoptimizable modules.
   * @param {string} moduleName
   * @param {boolean?} first=false Is this the root module?
   * @returns {boolean} `true` if the module is not optimizable.
   */
  function scan (moduleName, first)
  {
    var module = context.modules[moduleName];
    if (!module)
      throw new Error (sprintf ("Module '%' was not found.", moduleName));
    // Ignore the module if it's external.
    if (module.external)
      return false;
    if (!module.optimize) {
      if (first)
        module.nonOptimizedContainer = true;
      disableOptimizationsForChildrenOf (module);
      return true;
    }
    for (var i = 0, m = module.requires.length, any = false; i < m; ++i)
      if (scan (module.requires[i])) //Note: scan() still must be called for ALL submodules!
        any = true;
    if (any)
      module.nonOptimizedContainer = true;
    return false;
  }

  function disableOptimizationsForChildrenOf (module)
  {
    if (module.external)
      return;
    for (var i = 0, m = module.requires.length; i < m; ++i) {
      var sub = context.modules[module.requires[i]];
      if (sub.external)
        continue;
      if (sub.optimize)
        verboseOut.writeln (util.csprintf ('white', "Also disabling optimizations for <cyan>%</cyan>.", sub.name.cyan));
      sub.optimize = false;
      disableOptimizationsForChildrenOf (sub);
    }
  }
}