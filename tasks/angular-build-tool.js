/**
 * @license
 * AngularJS Build Tool Grunt plugin.
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * Licensed under the MIT license.
 */
'use strict';

var TASK_NAME = 'angular-build-tool';

var TASK_DESCRIPTION = 'Generates an optimized build of an AngularJS project.';

/**
 * Get color and style in your node.js console.
 * Note: requiring this here modifies the String prototype!
 */
var colors = require ('colors');
/**
 * Utility functions.
 */
var util = require ('./lib/util');

var tokenize = util.tokenize
  , getProperties = util.getProperties
  , toList = util.toList
  , indent = util.indent
  , sprintf = util.sprintf
  , csprintf = util.csprintf
  , debug = util.debug;
/**
 * OS dependent line terminator.
 * @type {string}
 */
var NL;

//------------------------------------------------------------------------------
// DECLARATIONS
//------------------------------------------------------------------------------

function ModuleDef ()
{
  this.bodies = [];
  this.filePaths = [];
}

/**
 * A module definition record.
 * Contains all javascript defining the module, read from one or more source files.
 */
ModuleDef.prototype = {
  /**
   * The module's name.
   * @type {string}
   */
  name:      '',
  /**
   * Relative file paths to the source script files.
   * The first entry corresponds to the file that starts the module definition.
   * @type {Array.<string>}
   */
  filePaths: null,
  /**
   * The content of the file that starts the module definition.
   * If null, the file was not yet read.
   * @type {String|null}
   */
  head:      null,
  /**
   * The content of each additional file that appends definitions to the module.
   * If there are no additional files for the module, the value will be an empty array.
   * @type {Array.<String>}
   */
  bodies:    null,
  /**
   * List with the names of the required modules.
   * If no modules are required, the value will be an empty array.
   * @type {Array.<String>}
   */
  requires:  null
};

var TASK_OPTIONS = {
  /**
   * Main module name. Only this module and its dependencies will be exported.
   * @type {string}
   */
  main:             '',
  /**
   * Name of the variable representing the angular module being defined, to be used inside self-invoked anonymous functions.
   * @type {string}
   */
  moduleVar:        'exports',
  /**
   * When <code>true</code>, angular module references passed as arguments to self-invoking functions will be renamed to <code>config.moduleVar</code>.
   *
   * When <code>false</code>, if the module reference parameter has a name that is different from the one defined on <code>config.moduleVar</code>,
   * a warning will be issued and the task may stop.
   * @type {boolean}
   */
  renameModuleRefs: false,
  /**
   * Code packaging method.
   * When false, generates a single optimized javascript file with all required source code in the correct loading order.
   * When true, generates a set of &lt;script> tags to include all the required source files in the correct loading order.
   * Note: The use of this setting as an option is, probably, not what you want.
   * Use the `debug` task argument instead.
   * @type {boolean}
   */
  debug:            false
};

var FILE_GROUP_OPTIONS = {
  /**
   * Target javascript file name.
   * The javascript build output will be saved to this path.
   * @type {string}
   */
  targetScript:       '',
  /**
   * Target CSS file name.
   * The packaged stylesheets will be saved to this path.
   * @type {string}
   */
  targetCSS:          '',
  /**
   * Target folder path for publishing assets.
   * Relative paths for the source files as specified in stylesheet asset urls are preserved on the output, so the required folder structure will be recreated on the output target.
   * Urls on the exported stylesheets will be rebased to this folder.
   * @type {string}
   */
  assetsTargetFolder: ''
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
// TASKS
//------------------------------------------------------------------------------

/**
 * Exports a function that will be called by Grunt to register tasks for this plugin.
 * @param grunt The Grunt API.
 */
module.exports = function (grunt)
{
  /**
   * A map of module names to module definition records.
   * @type {Object.<string,ModuleDef>}
   */
  var modules;
  /**
   * A map of module names to boolean values that registers which modules were already emmited to/ referenced on the output.
   * @type {Object.<string,boolean>}
   */
  var loaded;
  /**
   * Task-specific options set on the Gruntfile.
   * @type {TASK_OPTIONS}
   */
  var options;
  /**
   * <code>true</code> if the task is running in verbose mode.
   * @type {boolean}
   */
  var verbose;

  NL = grunt.util.linefeed;

  grunt.registerMultiTask (TASK_NAME, TASK_DESCRIPTION,
    function ()
    {
      // Merge task-specific and/or target-specific options with these defaults.
      options = this.options (TASK_OPTIONS);

      if (!options.main)
        grunt.fatal ("No main module is defined.");

      if (!this.files.length)
        grunt.fatal ("No source files were defined.");

      verbose = grunt.option ('verbose');

      // Iterate over all specified file groups and collect all scripts.

      this.files.forEach (function (/** FILE_GROUP_OPTIONS */ fileGroup)
      {
          // Reset source code analysis information for each file group, i.e. each group is an independent build.
        modules = {};
        loaded = {};

        if (!fileGroup.targetScript)
          grunt.fatal ("No target script is defined.");

        // Process the source files.
        fileGroup.src.forEach (loadScript);

        // On debug mode, output a script that dynamically loads all the required source files.
        if (options.debug === undefined ? this.flags.debug : options.debug)
          buildDebugPackage (options.main, fileGroup.targetScript, fileGroup.targetCSS);

        // On release mode, output an optimized script.
        else buildReleasePackage (options.main, fileGroup.targetScript, fileGroup.targetCSS);

      }.bind (this));
    });

  /**
   * Loads the specified script file and scans it for module definitions.
   * @param path
   */
  function loadScript (path)
  {
    if (!grunt.file.exists (path)) {
      grunt.log.warn ('Source file "' + path + '" not found.');
      return;
    }
    // Read the script and scan it for a module declaration.
    var script = grunt.file.read (path);
    var moduleHeader = extractModuleHeader (script);
    // Ignore irrelevant files.
    if (!moduleHeader) {
      grunt.log.writeln ('Ignored file:'.cyan, path);
      return;
    }
    // Get information about the specified module.
    var module = modules[moduleHeader.name];
    // If this is the first time a specific module is mentioned, create the respective information record.
    if (!module)
      module = modules[moduleHeader.name] = new ModuleDef;
    // Fill out the module definition record.
    module.name = moduleHeader.name;
    // The file is appending definitions to a module declared elsewhere.
    if (moduleHeader.append) {
      module.bodies.push (script);
      // Append the file path to the bottom of the paths list.
      module.filePaths.push (path);
    }
    // Otherwise, the file contains a module declaration.
    else {
      if (module.head)
        grunt.fatal ("Duplicate module definition: " + moduleHeader.name);
      module.head = script;
      // Add the file path to the top of the paths list.
      module.filePaths.unshift (path);
      module.requires = moduleHeader.requires;
    }
  }

  /**
   * Generates a script file that inserts SCRIPT tags to the head of the html document, which will load the original
   * source scripts in the correct order. This is used on debug builds.
   * @param {string} mainName Main module name.
   * @param {string} outputScriptFilename Path to the output script.
   * @param {string} outputCSSFilename Path to the output stylesheet.
   */
  function buildDebugPackage (mainName, outputScriptFilename, outputCSSFilename)
  {
    var output = ['document.write (\''];
    includeModule (mainName, output, buildDebugScriptForModule);
    output.push ('\');');
    grunt.file.write (outputScriptFilename, output.join ('\\\n'));
  }

  /**
   * Saves all script files required by the specified module into a single output file, in the correct
   * loading order. This is used on release builds.
   * @param {string} mainName Main module name.
   * @param {string} outputScriptFileName Path to the output script.
   * @param {string} outputCSSFilename Path to the output stylesheet.
   */
  function buildReleasePackage (mainName, outputScriptFileName, outputCSSFilename)
  {
    var output = [];
    includeModule (mainName, output, buildReleaseScriptForModule);
    grunt.file.write (outputScriptFileName, output.join ('\n'));
  }

  /**
   * Traces a dependency graph for the specified module and calls the given callback to process each required module
   * in the correct loading order.
   * @param {string} moduleName
   * @param {Array.<string>} output
   * @param {function(ModuleDef, Array.<string>)} processHook
   */
  function includeModule (moduleName, output, processHook)
  {
    var module = modules[moduleName];
    if (!module)
      grunt.fatal ("Module " + moduleName + " was not found.");
    // Include required submodules first.
    if (module.requires) {
      module.requires.forEach (function (modName)
      {
        includeModule (modName, output, processHook);
      });
    }
    if (!loaded[module.name]) {
      loaded[module.name] = true;
      processHook (module, output);
    }
  }

  /**
   * Outputs code for the specified module on a debug build.
   * @param {ModuleDef} module
   * @param {Array.<string>} output
   */
  function buildDebugScriptForModule (module, output)
  {
    module.filePaths.forEach (function (path)
    {
      output.push (sprintf ('<script src=\"%\"></script>', path));
    });
  }

  /**
   * Outputs the specified module on a release build.
   * @param {ModuleDef} module
   * @param {Array.<string>} output
   */
  function buildReleaseScriptForModule (module, output)
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
     * @private
     * Optimizes the source code and also performs some checks on it, preparing it for a subsequent
     * concatenation with other files from the same module.
     * If the source is already wrapping code in a self-invoking function, it unwraps it and renames module
     * references to match a future re-wrapping.
     * Then it replaces references to angular.module(name) by a shorter form.
     * @param {string} source
     * @param {string} path The script's file name, for use on error messages.
     * @returns {string}
     */
    function optimize (source, path)
    {
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
          , moduleName = m[4]
          , moduleDeps = m[5];

        if (moduleName && moduleName != module.name)
          grunt.log.warn ('Wrong module declaration: ' + moduleName);

        // Remove the existing closure from the source code.

        var p = source.indexOf (clean);
        // Extract any comments found before the closure.
        var before = source.substr (0, p);
        // Extract any comments found after the closure.
        var after = source.substr (p + clean.length);

        source = before + closureBody + after;

        // If the angular module is being passed as a parameter to the closure, rename that parameter to the
        // predefined name.
        if (moduleVar && moduleDecl && moduleVar != options.moduleVar) {
          if (options.renameModuleRefs)
            source = source.replace (new RegExp (sprintf (MATCH_IDENTIFIER_EXP, moduleVar), 'g'), options.moduleVar);
          else grunt.fail.warn (
            csprintf ('yellow', "Module reference <cyan>%</cyan> doesn't match the configuration setting <cyan>moduleVar='%'</cyan>." +
              NL + reportErrorLocation (path) +
              info ("Either rename the variable or enable <cyan>renameModuleRefs</cyan>.")
              , moduleVar, options.moduleVar)
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
        validateSourceCode (clean, path);
      }

      // Replace angular module expressions inside the closure by variable references.
      // If the module expression defines no services/whatever, remove-it, as it will be regenerated outside the closure.
      return source.replace (declPattern, function (m)
      {
        return m.substr (-1) == ')' ? options.moduleVar : '';
      });
    }

    // Append the module content to the output.

    // Fist process the head module declaration.
    var head = optimize (module.head, module.filePaths[0]);

    // Prevent the creation of an empty (or comments-only) self-invoking function.
    // In that case, the head content will be output without a wrapping closure.
    if (!module.bodies.length && head.match (MATCH_NO_SCRIPT)) {
      // Output the comments (if any).
      output.push (head);
      // Output a module declaration with no definifions.
      output.push (sprintf ("angular.module ('%', %);\n\n\n", module.name, toList (module.requires)));
    }
    else {
      // Enclose the module contents in a self-invoking function which receives the module instance as an argument.
      output.push ('(function (' + options.moduleVar + ') {\n');
      output.push (indent (head));
      for (var i = 0, m = module.bodies.length; i < m; ++i)
        output.push (indent (optimize (module.bodies[i], module.filePaths[i + 1])));
      //output.push.apply (output, module.bodies.map (optimize).map (indent));
      output.push (sprintf ("\n}) (angular.module ('%', %));\n\n\n", module.name, toList (module.requires)));
    }
  }

  /**
   * Checks if a block of javascript code performs any operation oother than defining a module.
   * In order to do that, it executes the code in an isolated sandbox.
   * If any function or variable is created on the global scope as a result from that execution, a waning is issued.
   * @param {string} source Javascript code to be analized.
   * @param {string} path The script's file name, for use on error messages.
   */
  function validateSourceCode (source, path)
  {
    var vm = require ('vm')
      , mockupMethod = function () { return angularModuleMockup }
      , angularModuleMockup = {
        animation:  mockupMethod,
        config:     mockupMethod,
        constant:   mockupMethod,
        controller: mockupMethod,
        directive:  mockupMethod,
        factory:    mockupMethod,
        filter:     mockupMethod,
        provider:   mockupMethod,
        run:        mockupMethod,
        service:    mockupMethod,
        value:      mockupMethod
      }
      , noop = function (x) {}
      , consoleMockup = {
        assert:         noop,
        debug:          noop,
        count:          noop,
        error:          noop,
        group:          noop,
        groupCollapsed: noop,
        groupEnd:       noop,
        info:           noop,
        log:            noop,
        profile:        noop,
        profileEnd:     noop,
        time:           noop,
        timeEnd:        noop,
        timeStamp:      noop,
        trace:          noop,
        warn:           noop
      }
      , sandbox = {
        angular: {
          module: function () { return angularModuleMockup }
        },
        console: consoleMockup,
        window:  {}
      };
    try {
      grunt.log.verbose.write ("Validating " + path.cyan + '...');
      vm.runInNewContext (source, sandbox);
      delete sandbox.angular;
      delete sandbox.console;
      delete sandbox.window;
      // Check if the sandbox contains any property at all.
      for (var prop in sandbox)
        throw sandbox;
      // The code passed validation.
      grunt.log.verbose.ok ();
    }
    catch (e) {
      // Code execution failed with an undefined reference or at least one new variable of function has been added to
      // the global scope.
      delete sandbox.angular;
      delete sandbox.console;
      delete sandbox.window;
      grunt.log.verbose.writeln ('FAILED'.yellow);
      warnAboutGlobalCode (sandbox, path);
      // If --force, continue.
    }
  }

  /**
   * Isses a warning about code found on the global scope.
   * @param {Object} sandbox
   * @param {string} path
   */
  function warnAboutGlobalCode (sandbox, path)
  {
    var msg = csprintf ('yellow', 'Code found on the global scope!'.red + NL +
      reportErrorLocation (path) +
      info (
        'This kind of code will behave differently between release and debug builds.' + NL +
          'You should wrap it in a self-invoking function.'
      )
    );
    if (verbose) {
      var found = false;
      getProperties (sandbox).forEach (function (e)
      {
        if (!found) {
          found = true;
          msg += '  Detected globals:'.yellow + NL;
        }
        msg += (typeof e[1] == 'function' ? '    function '.blue : '    var      '.blue) + e[0].cyan + NL;
      });
    }
    grunt.fail.warn (msg + '>>'.yellow);
  }

  function reportErrorLocation (path)
  {
    return csprintf ('yellow', '  File: <cyan>%</cyan>' + NL, path);
  }

  /**
   * @private
   * Searches for an angular module declaration and, if found, extracts the module's name and dependencies from it.
   * Note: if the returned 'requires' property is undefined, that means the module declaration is appending
   * definitions to a module defined elsewhere.
   * Otherwise, the module declaration is beginning the module definition.
   * @param {string} source Javascript source code.
   * @returns {{name: *, requires: Array.<string>|undefined, append: boolean}|null} Null means the file does not contain any
   * module definition.
   */
  function extractModuleHeader (source)
  {
    var m = source.match (MATCH_MODULE_DECL);
    // Ignore the file if it has no angular module definition.
    if (!m)
      return null;
    return {
      name:     m[1],
      append:   !m[2],
      requires: m[2] && JSON.parse (m[2].replace (/'/g, '"')) || []
    }
  }

  /**
   * @private
   * Returns the given message colored grey if running in verbose mode otherwise, returns a generic short message.
   * @param msg
   * @returns {*}
   */
  function info (msg)
  {
    return (verbose ? indent (csprintf ('grey', msg)) : '  Use -v for more info.'.grey) + NL;
  }

};
