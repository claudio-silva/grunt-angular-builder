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
  , types = require ('./lib/types')
  , analyser = require ('./lib/angularAnalyser');

var Context = types.Context
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
   * Task-specific options set on the Gruntfile.
   * @type {TASK_OPTIONS}
   */
  var options;
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

    loadExtensions ();

    //-------------------------
    // Process each file group
    //-------------------------

    this.files.forEach (function (/** FILE_GROUP_OPTIONS */ fileGroup)
    {
      // Note: source code analysis information for each file group is reset for each file group,
      // i.e. each group is an independent build.

      var context = new Context(grunt, this);

      /**
       * The list of loaded extensions.
       * These will be reset for each file group.
       * @type {ExtensionInterface[]}
       */
      var extensions = instantiateExtensions (context);

      //------------------
      // LOAD SOURCE CODE
      //------------------

      if (!fileGroup.dest)
        fatal ('No target script is defined.');

      analyser.run (grunt, fileGroup, context.modules, context.standaloneScripts);

      //------------------
      // BUILD
      //------------------

      writeln ('Generating the <cyan>%</cyan> build...', context.debugBuild ? 'debug' : 'release');

      // Trace the dependency graph and invoke each extension over each module.

      traceModule (options.main, context, function (/*ModuleDef*/module)
      {
        extensions.forEach (function (/*ExtensionInterface*/ extension)
        {
          extension.trace (module);
        });
      });

      // Run all extensions over the analysed source code.

      extensions.forEach (function (/*ExtensionInterface*/ extension)
      {
        extension.build (fileGroup.dest, context.standaloneScripts);
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
   * @param {Context} context The build execution context.
   * @returns {ExtensionInterface[]}
   */
  function instantiateExtensions (context)
  {
    var extensions = [];
    extensionsClasses.forEach (function (ExtensionClass)
    {
      //noinspection JSValidateTypes
      extensions.push (new ExtensionClass (context));
    });
    return extensions;
  }

  /**
   * Traces a dependency graph for the specified module and calls the given callback
   * to process each required module in the correct loading order.
   * @param {string} moduleName
   * @param {Context} context The execution context for the build pipeline.
   * @param {function(ModuleDef)} processHook
   */
  function traceModule (moduleName, context, processHook)
  {
    var module = context.modules[moduleName];
    if (!module)
      fatal ('Module <cyan>%</cyan> was not found.', moduleName);
    // Ignore the module if it's external.
    if (module.external)
      return;
    // Include required submodules first.
    if (module.requires) {
      module.requires.forEach (function (modName)
      {
        traceModule (modName, context, processHook);
      });
    }
    // Ignore references to already loaded modules or to explicitly excluded modules.
    if (!context.loaded[module.name] && !~options.excludedModules.indexOf (module.name)) {
      info ('Including module <cyan>%</cyan>.', moduleName);
      context.loaded[module.name] = true;
      processHook (module);
    }
  }

};
