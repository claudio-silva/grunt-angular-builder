/**
 * @license
 * AngularJS Build Tool Grunt plugin.
 * Copyright 2013 Cláudio Manuel Brás da Silva.
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

var TASK_NAME = 'angular-builder';

var TASK_DESCRIPTION = 'Generates a release/debug build of an AngularJS project.';

/**
 * Utility functions.
 */
var util = require ('./lib/gruntUtil')
  , nodeUtil = require ('util')
  , types = require ('./lib/types')
  , analyser = require ('./lib/angularAnalyser');

var ModuleDef = types.ModuleDef
  , fatal = util.fatal
  , info = util.info
  , writeln = util.writeln;

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
   * A list of scripts that have no module definitions but still are forced to being included in the build.
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
  var extensionsClasses;

  util.init (grunt);

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

    loadExtensions ();

    //-------------------------
    // Process each file group
    //-------------------------

    this.files.forEach (function (/** FILE_GROUP_OPTIONS */ fileGroup)
    {
      // Note: source code analysis information for each file group is reset for each file group,
      // i.e. each group is an independent build.

      /**
       * The list of loaded extensions.
       * These will be reset for each file group.
       * @type {ExtensionInterface[]}
       */
      var extensions = instantiateExtensions (debugBuild);

      //------------------
      // LOAD SOURCE CODE
      //------------------

      // Clone the external modules and use it as a starting point.
      modules = nodeUtil._extend ({}, externals);
      standaloneScripts = []; // Reset scripts.

      if (!fileGroup.dest)
        fatal ('No target script is defined.');

      analyser.run (grunt, fileGroup, modules, standaloneScripts);

      //------------------
      // BUILD
      //------------------

      writeln ('Generating the <cyan>%</cyan> build...', debugBuild ? 'debug' : 'release');

      // Trace the dependency graph and invoke each extension over each module.

      loaded = {}; // Reset tracer.
      traceModule (options.main, function (/*ModuleDef*/module)
      {
        extensions.forEach (function (/*ExtensionInterface*/ extension)
        {
          extension.trace (module);
        });
      });

      // Run all extensions over the analysed source code.

      extensions.forEach (function (/*ExtensionInterface*/ extension)
      {
        extension.build (fileGroup.dest, standaloneScripts);
      });

    }.bind (this));
  });

  /**
   * Loads all extensions.
   */
  function loadExtensions ()
  {
    extensionsClasses = [];

    options.bundledExtensions.forEach (function (name)
    {
      extensionsClasses.push (require (name));
    });

    if (options.extensions)
      options.extensions.forEach (function (name)
      {
        extensionsClasses.push (require (name));
      });
  }

  /**
   * Creates a new instance of each loaded extension.
   * @param {boolean} debugBuild Is this a debug build?
   * @returns {ExtensionInterface[]}
   */
  function instantiateExtensions (debugBuild)
  {
    var extensions = [];
    extensionsClasses.forEach (function (ExtensionClass)
    {
      //noinspection JSValidateTypes
      extensions.push (new ExtensionClass (grunt, options, debugBuild));
    });
    return extensions;
  }

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

};
