/**
 * @license
 * AngularJS Builder.
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
var util  = require ('./lib/gruntUtil')
  , types = require ('./lib/types');

var Context      = types.Context
  , ContextEvent = types.ContextEvent
  , TaskOptions  = types.TaskOptions
  , extend       = util.extend
  , fatal        = util.fatal
  , info         = util.info;
/**
 * Exports a function that will be called by Grunt to register tasks for this plugin.
 * @param grunt The Grunt API.
 */
module.exports = function (grunt)
{
  util.init (grunt);

//------------------------------------------------------------------------------
// GRUNT TASK
//------------------------------------------------------------------------------

  grunt.registerMultiTask (TASK_NAME, TASK_DESCRIPTION, function ()
  {
    //------------------
    // SETUP
    //------------------

    if (!this.files.length)
      fatal ('No source files were defined.');

    /**
     * The default values for all of the Angular Builder's options.
     * @type {TaskOptions}
     */
    var defaultOptions = new TaskOptions ();

    /**
     * An ordered list of middleware classes from which the middleware stack will be created later on.
     *
     * Note: when loading the middleware modules, the TaskOptions class becomes augmented with middleware-specific
     * options.
     * @type {MiddlewareInterface[]}
     */
    var middlewareStackClasses = loadMiddlewareModules (defaultOptions);

    //-------------------------
    // Process each file group
    //-------------------------

    this.files.forEach (function (/** GruntFilesArrayExt */ fileGroup)
    {
      // Note: source code analysis information for each file group is reset for each file group,
      // i.e. each group is an independent build.

      var context = new Context (grunt, this, defaultOptions);

      if (!context.options.mainModule)
        fatal ('No main module is defined.');

      /**
       * The sequential list of loaded middleare.
       * These will be reset for each file group.
       * @type {MiddlewareInterface[]}
       */
      var middlewareStack = assembleMiddleware (middlewareStackClasses, context);

      context.trigger (ContextEvent.ON_INIT);

      //------------------
      // LOAD SOURCE CODE
      //------------------

      if (!fileGroup.dest)
        fatal ('No target script is defined.');

      // Pass all the source code trough the 1st stage of the middleware stack.

      middlewareStack.forEach (function (/*MiddlewareInterface*/ middleware)
      {
        middleware.analyze (fileGroup);
      });

      context.trigger (ContextEvent.ON_AFTER_ANALYZE);

      //------------------
      // BUILD
      //------------------

      // Trace the dependency graph and pass each module trough the 2nd stage of the middleware stack.

      traceModule (context.options.mainModule, context, function (/*ModuleDef*/module)
      {
        middlewareStack.forEach (function (/*MiddlewareInterface*/ middleare)
        {
          middleare.trace (module);
        });
      });

      context.trigger (ContextEvent.ON_AFTER_TRACE);

      // Pass all the analysed source code trough the 3rd stage of the middleware stack.

      middlewareStack.forEach (function (/*MiddlewareInterface*/ middleware)
      {
        middleware.build (fileGroup.dest);
      });

      context.trigger (ContextEvent.ON_AFTER_BUILD);

    }.bind (this));
  });

  /**
   * Loads all middlewares (both internal and external).
   *
   * @param {TaskOptions} options The task's base default options. Extended options contributed by middleware will be
   * set in turn by each loaded middleware module.
   * @return {Array}
   */
  function loadMiddlewareModules (options)
  {
    var middlewareStackClasses = [];

    options.internalMiddleware.forEach (function (moduleName)
    {
      var module = require (moduleName);
      if (!module.middleware)
        util.fatal ('No middleware found on module %.', moduleName);
      if (module.options)
        extend (options, module.options);
      middlewareStackClasses.push (module.middleware);
    });

    if (options.externalMiddleware)
      options.externalMiddleware.forEach (function (info)
      {
        var module = require (info.load);
        if (module.options)
          extend (options, new module.options ());
        var target = info.before || info.after
          , i = middlewareStackClasses.indexOf (target);
        if (~i)
          util.fatal ("Can't locate the % middleware module for inserting %.", target, info.load);
        middlewareStackClasses.splice (i + (info.before ? 0 : 1), 0, module.middleware);
      });

    return middlewareStackClasses;
  }

  /**
   * Creates a new instance of each loaded middleware and assembles them into a sequential list.
   * @param {MiddlewareInterface[]} middlewareStackClasses An ordered list of classes to be instantiated.
   * @param {Context} context The build execution context.
   * @returns {MiddlewareInterface[]}
   */
  function assembleMiddleware (middlewareStackClasses, context)
  {
    var middlewares = [];
    middlewareStackClasses.forEach (function (MiddlewareClass)
    {
      middlewares.push (new MiddlewareClass (context));
    });
    return middlewares;
  }

  /**
   * Traces a dependency graph for the specified module and calls the given callback
   * to process each required module in the correct loading order.
   * @param {string} moduleName
   * @param {Context} context The execution context for the middleware stack.
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
    context.trigger (ContextEvent.ON_BEFORE_DEPS, [module]);
    module.requires.forEach (function (modName)
    {
      traceModule (modName, context, processHook);
    });
    // Ignore references to already loaded modules or to explicitly excluded modules.
    if (!context.loaded[module.name] && !~context.options.excludedModules.indexOf (module.name)) {
      info ('Including module <cyan>%</cyan>.', moduleName);
      context.loaded[module.name] = true;
      processHook (module);
    }
  }

};
