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
 * Utility functions.
 */
var util = require ('./lib/util')
  , nodeUtil = require ('util')
  , types = require ('./lib/types')
  , sourceTrans = require ('./lib/sourceTrans')
  , sourceExtract = require ('./lib/sourceExtract')
  , gruntUtil = require ('./lib/gruntUtil');

var getProperties = util.getProperties
  , toList = util.toList
  , indent = util.indent
  , sprintf = util.sprintf
  , csprintf = util.csprintf
  , debug = util.debug
  , ModuleDef = types.ModuleDef
  , fatal = gruntUtil.fatal
  , warn = gruntUtil.warn
  , info = gruntUtil.info
  , reportErrorLocation = gruntUtil.reportErrorLocation
  , writeln = gruntUtil.writeln
  , NL = util.NL
  , OperationResult = types.OperationResult;

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
   * A map of file names to boolean values that registers which files were already created on the output.
   * When attempting to save a file, if another one with the same name already exists at the target location, the builder
   * will erase the existing file before writing to it if the file is not registered here, otherwise it will append to it.
   * @type {Object.<string,boolean>}
   */
  var created;
  /**
   * A list of scripts that have no module definitions but that are forced to still being included in the build.
   * Each item contains the filename and the file content.
   * @type {Array.<{path: string, content: string}>}
   */
  var standaloneScripts;
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
  /**
   * Grunt's verbose output API.
   * @type {Object}
   */
  var verboseOut = grunt.log.verbose;

  gruntUtil.init (grunt);

  grunt.registerMultiTask (TASK_NAME, TASK_DESCRIPTION,
    function ()
    {
      // Merge task-specific and/or target-specific options with these defaults.
      options = this.options (types.TASK_OPTIONS);

      if (!options.main)
        fatal ("No main module is defined.");

      if (!this.files.length)
        fatal ("No source files were defined.");

      verbose = grunt.option ('verbose');
      created = {};

      var externals = setupExternalModules ();
      /**
       * Is this a debug build?
       * Note: the debug build mode can be set via three different settings.
       * @type {boolean}
       */
      var debugBuild = grunt.option ('build') === 'debug' || (this.flags.debug === undefined ? options.debug : this.flags.debug);

      // Iterate over all specified file groups and collect all scripts.

      this.files.forEach (function (/** FILE_GROUP_OPTIONS */ fileGroup)
      {
        // Reset source code analysis information for each file group, i.e. each group is an independent build.

        loaded = {};
        standaloneScripts = [];
        // Clone the external modules and use it as a starting point.
        modules = nodeUtil._extend ({}, externals);


        if (!fileGroup.targetScript)
          fatal ("No target script is defined.");

        // Process the source files.
        fileGroup.src.forEach (loadScript.bind (null, fileGroup.forceInclude));

        writeln ("Generating the <cyan>%</cyan> build...", debugBuild ? 'debug' : 'release');

        // On debug mode, output a script that dynamically loads all the required source files.
        if (debugBuild)
          buildDebugPackage (options.main, fileGroup.targetScript, fileGroup.targetCSS);

        // On release mode, output an optimized script.
        else buildReleasePackage (options.main, fileGroup.targetScript, fileGroup.targetCSS);

      }.bind (this));
    });

  /**
   * Registers the configured external modules so that they can be ignored during the build output generation.
   * @returns {Object.<string, ModuleDef>}
   */
  function setupExternalModules ()
  {
    /** @type {Object.<string, ModuleDef>} */
    var modules = {};
    (options.externalModules || []).forEach (function (moduleName)
    {
      /** @type {ModuleDef} */
      var module = modules[moduleName] = new ModuleDef ();
      module.name = moduleName;
      module.external = true;
    });
    return modules;
  }

  /**
   * Loads the specified script file and scans it for module definitions.
   * @param {string|Array.<string>|null} forceInclude
   * @param {string} path
   */
  function loadScript (forceInclude, path)
  {
    if (!grunt.file.exists (path)) {
      grunt.log.warn ('Source file "' + path + '" not found.');
      return;
    }
    // Read the script and scan it for a module declaration.
    var script = grunt.file.read (path);
    var moduleHeader = sourceExtract.extractModuleHeader (script);
    // Ignore irrelevant files.
    if (!moduleHeader) {
      if (!forceInclude || !grunt.file.isMatch ({matchBase: true}, forceInclude, path)) {
        grunt.log.writeln ('Ignored file:'.cyan, path);
        return;
      }
      standaloneScripts.push ({
        path:    path,
        content: script
      });
    }
    else {
      // Get information about the specified module.
      var module = modules[moduleHeader.name];
      // If this is the first time a specific module is mentioned, create the respective information record.
      if (!module)
        module = modules[moduleHeader.name] = new ModuleDef ();
      else if (!moduleHeader.append)
        fatal ("Can't redeclare the external module <cyan>%</cyan>", moduleHeader.name);
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
          fatal ("Duplicate module definition: <cyan>%</cyan>", moduleHeader.name);
        module.head = script;
        // Add the file path to the top of the paths list.
        module.filePaths.unshift (path);
        module.requires = moduleHeader.requires;
      }
    }
  }

  /**
   * Generates a script file that inserts SCRIPT tags to the head of the html document, which will load the original
   * source scripts in the correct order. This is used on debug builds.
   * @param {string} mainName Main module name.
   * @param {string} targetScript Path to the output script.
   * @param {string} targetStylesheet Path to the output stylesheet.
   */
  function buildDebugPackage (mainName, targetScript, targetStylesheet)
  {
    var output = ['document.write (\''];

    // Output the standalone scripts (if any).
    if (standaloneScripts.length)
      output.push (standaloneScripts.map (function (e)
      {
        return sprintf ('<script src=\"%\"></script>', e.path);
      }).join ('\\\n'));

    // Output the modules (if any).
    includeModule (mainName, output, buildDebugScriptForModule);
    output.push ('\');');
    writeFile (targetScript, output.join ('\\\n'));
  }

  /**
   * Saves all script files required by the specified module into a single output file, in the correct
   * loading order. This is used on release builds.
   * @param {string} mainName Main module name.
   * @param {string} targetScript Path to the output script.
   * @param {string} targetStylesheet Path to the output stylesheet.
   */
  function buildReleasePackage (mainName, targetScript, targetStylesheet)
  {
    var output = [];

    // Output the standalone scripts (if any).
    if (standaloneScripts.length)
      output.push (standaloneScripts.map (function (e) {return e.content;}).join ('\n'));

    // Output the modules (if any).
    includeModule (mainName, output, buildReleaseScriptForModule);
    writeFile (targetScript, output.join ('\n'));
  }

  /**
   * Writes or appends content to a file.
   * @param {string} path
   * @param {string} content
   */
  function writeFile (path, content)
  {
    if (grunt.file.exists (path)) {
      if (created [path]) {
        // Append to existing file.
        var data = grunt.file.read (path);
        grunt.file.write (path, data + '\n' + content);
      }
      else {
        // Re-create file.
        grunt.file.delete (path);
        grunt.file.write (path, content);
      }
    }
    // Create file.
    else grunt.file.write (path, content);
    created [path] = true;
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
      fatal ("Module <cyan>%</cyan> was not found.", moduleName);
    // Ignore the module if it's external.
    if (module.external)
      return;
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
     * Calls sourceTrans.optimize() and handles the result.
     * @param {string} source
     * @param {string} path For error messages.
     * @returns {string|undefined} The (un)optimized source code.
     * @throws Error Sanity check.
     */
    function optimize (source, path)
    {
      var result = sourceTrans.optimize (source, module.name, options.moduleVar);
      if (typeof result === 'string')
        return result;
      var stat = sourceTrans.TRANS_STAT;
      switch (result.status) {

        case stat.OK:

          return sourceTrans.renameModuleRefExps(module, result.data, options.moduleVar);

        case stat.NO_CLOSURE_FOUND:

          // The source code must be validate to make sure it's safe.
          verboseOut.write ("Validating " + path.cyan + '...');
          var valid = sourceTrans.validateUnwrappedCode (source);
          if (valid)
          // The code passed validation.
            verboseOut.ok ();
          else {
            verboseOut.writeln ('FAILED'.yellow);
            warnAboutGlobalCode (valid, path);
            // If --force, continue.
          }
          // Return the source code unmodified.
          return source;

        case stat.RENAME_REQUIRED:

          if (options.renameModuleRefs)
            return sourceTrans.renameModuleVariableRefs (source, result.data, options.moduleVar);
          else
            warn ("The module variable reference <cyan>%</cyan> doesn't match the preset name on the config. setting <cyan>moduleVar='%'</cyan>.%%%",
            result.data, options.moduleVar, NL, reportErrorLocation (path),
            info ("Either rename the variable or enable <cyan>renameModuleRefs</cyan>.")
          );
          // If --force, continue.
          break;


        default:
          throw new Error ('Unknown status code ' + result);
      }
    }

    // Fist process the head module declaration.
    var head = optimize (module.head, module.filePaths[0]);

    // Prevent the creation of an empty (or comments-only) self-invoking function.
    // In that case, the head content will be output without a wrapping closure.
    if (!module.bodies.length && sourceExtract.matchWhiteSpaceOrComments (head)) {
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
   * Isses a warning about code found on the global scope.
   * @param {Object} sandbox
   * @param {string} path
   */
  function warnAboutGlobalCode (sandbox, path)
  {
    var msg = csprintf ('yellow', 'Incompatible code found on the global scope!'.red + NL +
      reportErrorLocation (path) +
      info (
        'This kind of code will behave differently between release and debug builds.' + NL +
          'You should wrap it in a self-invoking function and/or assign global variables/functions directly to the window object.'
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
        msg += (typeof e[1] === 'function' ? '    function '.blue : '    var      '.blue) + e[0].cyan + NL;
      });
    }
    warn (msg + '>>'.yellow);
  }

};
