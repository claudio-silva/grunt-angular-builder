/**
 * @license
 * AngularJS Build Tool Grunt plugin.
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * Licensed under the MIT license.
 */
'use strict';

var TASK_NAME = 'angular-builder';

var TASK_DESCRIPTION = 'Generates a release/debug build of an AngularJS project.';

/**
 * Utility functions.
 */
var util = require ('./lib/util')
  , nodeUtil = require ('util')
  , types = require ('./lib/types')
  , sourceExtract = require ('./lib/sourceExtract')
  , gruntUtil = require ('./lib/gruntUtil');

var ModuleDef = types.ModuleDef
  , fatal = gruntUtil.fatal
  , warn = gruntUtil.warn
  , info = gruntUtil.info
  , reportErrorLocation = gruntUtil.reportErrorLocation
  , writeln = gruntUtil.writeln
  , arrayAppend = util.arrayAppend
  , NL = util.NL;

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
   * A map of module names to boolean values that registers which modules were already
   * emmited to/ referenced on the output.
   * @type {Object.<string,boolean>}
   */
  var loaded;
  /**
   * A map of file names to boolean values that registers which files were already created on the output.
   * When attempting to save a file, if another one with the same name already exists at the target location,
   * the builder will erase the existing file before writing to it if the file is not registered here, otherwise
   * it will append to it.
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
   * @type {Class[]}
   */
  var addOnsClasses = [];

  gruntUtil.init (grunt);

//------------------------------------------------------------------------------
// GRUNT TASK
//------------------------------------------------------------------------------

  grunt.registerMultiTask (TASK_NAME, TASK_DESCRIPTION, function ()
  {
    //------------------
    // SETUP
    //------------------

    // Merge task-specific and/or target-specific options with these defaults.
    options = this.options (types.TASK_OPTIONS);

    if (!options.main)
      fatal ('No main module is defined.');

    if (!this.files.length)
      fatal ('No source files were defined.');

    verbose = grunt.option ('verbose');
    created = {};

    var externals = setupExternalModules ();
    /**
     * Is this a debug build?
     * Note: the debug build mode can be set via three different settings.
     * @type {boolean}
     */
    var debugBuild = grunt.option ('build') === 'debug' ||
      (this.flags.debug === undefined ? options.debug : this.flags.debug);

    // Load add-ons.

    options.bundledAddOns.forEach (function (name)
    {
      addOnsClasses.push (require (name));
    });

    if (options.addOns)
      options.addOns.forEach (function (name)
      {
        addOnsClasses.push (require (name));
      });

    //-------------------------
    // Process each file group
    //-------------------------

    this.files.forEach (function (/** FILE_GROUP_OPTIONS */ fileGroup)
    {
      // Reset source code analysis information for each file group, i.e. each group is an independent build.

      //------------------
      // LOAD SOURCE CODE
      //------------------

      loaded = {}; // Reset tracer.
      standaloneScripts = []; // Reset scripts.
      // Clone the external modules and use it as a starting point.
      modules = nodeUtil._extend ({}, externals);

      if (!fileGroup.dest)
        fatal ('No target script is defined.');

      // Process the source files.
      var src = gruntUtil.sortFilesBeforeSubfolders (fileGroup.src);
      src.forEach (loadScript.bind (null, fileGroup.forceInclude));

      //------------------
      // LOAD ADD-ONS
      //------------------

      /**
       * The list of loaded add-ons.
       * @type {AddOnInterface[]}
       */
      var addOns = [];

      addOnsClasses.forEach (function (AddOnClass)
      {
        //noinspection JSValidateTypes
        addOns.push (new AddOnClass (grunt, options, debugBuild));
      });

      //------------------
      // BUILD
      //------------------

      writeln ('Generating the <cyan>%</cyan> build...', debugBuild ? 'debug' : 'release');

      /** @type {string[]} */
      var tracedPaths = [];

      // Trace the dependency graph and invoke each add-on.

      traceModule (options.main, function (/*ModuleDef*/module)
      {
        arrayAppend (tracedPaths, module.filePaths);
        addOns.forEach (function (/*AddOnInterface*/ addOn)
        {
          addOn.trace (module);
        });
      });

      addOns.forEach (function (/*AddOnInterface*/ addOn)
      {
        addOn.build (fileGroup.dest, tracedPaths, standaloneScripts);
      });

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
    ((typeof options.externalModules === 'string' ? [options.externalModules] : options.externalModules) || []).
      forEach (function (moduleName)
    {
      /** @type {ModuleDef} */
      var module = modules[moduleName] = new ModuleDef ();
      module.name = moduleName;
      module.external = true;
    });
    return modules;
  }

  //------------------------------------------------------------------------------
  // SCAN SOURCES
  //------------------------------------------------------------------------------

  /**
   * Loads the specified script file and scans it for module definitions.
   * @param {string|Array.<string>|null} forceInclude
   * @param {string} path
   */
  function loadScript (forceInclude, path)
  {
    if (!grunt.file.exists (path)) {
      warn ('Source file "' + path + '" not found.');
      return;
    }
    // Read the script and scan it for a module declaration.
    var script = grunt.file.read (path);
    var moduleHeader = sourceExtract.extractModuleHeader (script);
    // Ignore irrelevant files.
    if (!moduleHeader) {
      if (!forceInclude || !grunt.file.isMatch ({matchBase: true}, forceInclude, path)) {
        info ('Ignored file: %', path.cyan);
        return;
      }
      standaloneScripts.push ({
        path:    path,
        content: script
      });
    }
    else setupModuleInfo (moduleHeader, script, path);
  }

  /**
   * Store information about the specified module retrieved from the given source code on the specified file.
   * @param {ModuleHeaderInfo} moduleHeader
   * @param {string} fileContent
   * @param {string} filePath
   */
  function setupModuleInfo (moduleHeader, fileContent, filePath)
  {
    var STAT = sourceExtract.EXTRACT_STAT;
    switch (moduleHeader.status) {

      case STAT.OK:

        // Get information about the specified module.
        var module = modules[moduleHeader.name];
        // If this is the first time a specific module is mentioned, create the respective information record.
        if (!module)
          module = modules[moduleHeader.name] = new ModuleDef ();
        // Skip the file if it defines an external module.
        else if (module.external)
          return;
        // Reject additional attempts to redeclare a module (only appending is allowed).
        else if (module.head && !moduleHeader.append)
          fatal ('Can\'t redeclare module <cyan>%</cyan>', moduleHeader.name);
        // Fill out the module definition record.
        module.name = moduleHeader.name;
        // The file is appending definitions to a module declared elsewhere.
        if (moduleHeader.append) {
          module.bodies.push (fileContent);
          // Append the file path to the bottom of the paths list.
          module.filePaths.push (filePath);
        }
        // Otherwise, the file contains a module declaration.
        else {
          if (module.head)
            fatal ('Duplicate module definition: <cyan>%</cyan>', moduleHeader.name);
          module.head = fileContent;
          // Add the file path to the top of the paths list.
          module.filePaths.unshift (filePath);
          module.requires = moduleHeader.requires;
        }
        break;

      case STAT.MULTIPLE_MODULES:

        fatal ('Definitions for multiple modules were found on the same file.' + NL + reportErrorLocation (filePath));
        break;

      case STAT.MULTIPLE_DECLS:

        fatal ('More than one module declaration was found on the same file.' + NL + reportErrorLocation (filePath));
    }
  }

  //------------------------------------------------------------------------------
  // BUILD (COMMON)
  //------------------------------------------------------------------------------

  /**
   * Traces a dependency graph for the specified module and calls the given callback
   * to process each required module in the correct loading order.
   * @param {string} moduleName
   * @param {function(ModuleDef)} processHook
   */
  function traceModule (moduleName, processHook)
  {
    var module = modules[moduleName];
    if (!module)
      fatal ('Module <cyan>%</cyan> was not found.', moduleName);
    // Ignore the module if it's external.
    if (module.external)
      return;
    // Include required submodules first.
    if (module.requires) {
      module.requires.forEach (function (modName)
      {
        traceModule (modName, processHook);
      });
    }
    // Ignore references to already loaded modules.
    if (!loaded[module.name]) {
      info ('Including module <cyan>%</cyan>.', moduleName);
      loaded[module.name] = true;
      processHook (module);
    }
  }

};
