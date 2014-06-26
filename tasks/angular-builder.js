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

    /**
     * An ordered list of middleware classes that will form the build pipeline.
     * @type {MiddlewareInterface[]}
     */
    var pipelineClasses = loadMiddleware ();

    //-------------------------
    // Process each file group
    //-------------------------

    this.files.forEach (function (/** GruntFilesArrayExt */ fileGroup)
    {
      // Note: source code analysis information for each file group is reset for each file group,
      // i.e. each group is an independent build.

      var context = new Context (grunt, this);

      /**
       * The sequential list of loaded middleare.
       * These will be reset for each file group.
       * @type {MiddlewareInterface[]}
       */
      var pipeline = createPipeline (pipelineClasses, context);

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

      // Trace the dependency graph and pass each module trough the middleware pipeline.

      traceModule (options.main, context, function (/*ModuleDef*/module)
      {
        pipeline.forEach (function (/*MiddlewareInterface*/ middleare)
        {
          middleare.trace (module);
        });
      });

      // Pass all the analysed source code trough the middleware pipeline.

      pipeline.forEach (function (/*MiddlewareInterface*/ middleware)
      {
        middleware.build (fileGroup.dest, context.standaloneScripts);
      });

    }.bind (this));
  });

  /**
   * Loads all middleware (both internal and external).
   */
  function loadMiddleware ()
  {
    var pipelineClasses = [];

    options.internalMiddleware.forEach (function (moduleName)
    {
      pipelineClasses.push (require (moduleName));
    });

    if (options.externalMiddleware)
      options.externalMiddleware.forEach (function (info)
      {
        var module = require (info.load)
          , target = info.before || info.after
          , i = pipelineClasses.indexOf (target);
        if (~i)
          util.fatal ('The % middleware module was not found.', target);
        pipelineClasses.splice (i + (info.before ? 0 : 1), 0, module);
      });

    return pipelineClasses;
  }

  /**
   * Creates a new instance of each loaded middleware and assembles them into a sequential list.
   * @param {MiddlewareInterface[]} pipelineClasses An ordered list of classes to be instantiated.
   * @param {Context} context The build execution context.
   * @returns {MiddlewareInterface[]}
   */
  function createPipeline (pipelineClasses, context)
  {
    var middleware = [];
    pipelineClasses.forEach (function (MiddlewareClass)
    {
      middleware.push (new MiddlewareClass (context));
    });
    return middleware;
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
