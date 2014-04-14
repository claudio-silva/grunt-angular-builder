'use strict';

module.exports = ReleaseBuildExtension;

var util = require ('../lib/gruntUtil')
  , sourceTrans = require ('../lib/sourceTrans')
  , sourceExtract = require ('../lib/sourceExtract');

var indent = util.indent
  , sprintf = util.sprintf
  , csprintf = util.csprintf
  , warn = util.warn
  , getExplanation = util.getExplanation
  , reportErrorLocation = util.reportErrorLocation
  , NL = util.NL;

/**
 * Error codes returned by some functions in this module.
 * @enum
 */
var STAT = {
  OK:       0,
  INDENTED: 1
};

/**
 * Saves all script files required by the specified module into a single output file, in the correct
 * loading order. This is used on release builds.
 * @constructor
 * @implements {ExtensionInterface}
 * @param grunt The Grunt API.
 * @param {TASK_OPTIONS} options Task configuration options.
 * @param {boolean} debugBuild Debug mode flag.
 */
function ReleaseBuildExtension (grunt, options, debugBuild)
{
  /**
   * <code>true</code> if the task is running in verbose mode.
   * @type {boolean}
   */
  var verbose = grunt.option ('verbose');
  /**
   * Grunt's verbose output API.
   * @type {Object}
   */
  var verboseOut = grunt.log.verbose;
  /** @type {string[]} */
  var traceOutput = [];

  /**
   * @inheritDoc
   */
  this.trace = function (module)
  {
    if (debugBuild) return;

    // Fist process the head module declaration.
    var head = optimize (module.head, module.filePaths[0], module);

    // Prevent the creation of an empty (or comments-only) self-invoking function.
    // In that case, the head content will be output without a wrapping closure.
    if (!module.bodies.length && sourceExtract.matchWhiteSpaceOrComments (head.data)) {
      // Output the comments (if any).
      if (head.data.trim ())
        module.push (head.data);
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
      traceOutput.push (sprintf ('\n}) (angular.module (\'%\', %));%', module.name,
        util.toQuotedList (module.requires), options.moduleFooter));
    }
  };

  /**
   * @inheritDoc
   * @param {string} targetScript Path to the output script.
   * @param {Array.<{path: string, content: string}>} standaloneScripts
   */
  this.build = function (targetScript, standaloneScripts)
  {
    if (debugBuild) return;

    /** @type {string[]} */
    var output = [];

    // Output the standalone scripts (if any).
    if (standaloneScripts.length)
      output.push (standaloneScripts.map (function (e) {return e.content;}).join (NL));

    // Output the modules (if any).
    util.arrayAppend (output, traceOutput);

    util.writeFile (targetScript, output.join (NL));
  };

  //------------------------------------------------------------------------------
  // PRIVATE
  //------------------------------------------------------------------------------

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
