/**
 * An AngularJS source code loader and analyser.
 *
 * @module middleware/analyzer
 *
 * @license
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

exports.middleware = AnalyzerMiddleware;

var util = require ('../lib/gruntUtil')
  , types = require ('../lib/types')
  , sourceExtract = require ('../lib/sourceExtract');

var ModuleDef = types.ModuleDef
  , warn = util.warn
  , reportErrorLocation = util.reportErrorLocation
  , fatal = util.fatal
  , info = util.info
  , NL = util.NL;

/**
 * An AngularJS source code loader and analyser middleware.
 *
 * @constructor
 * @implements {MiddlewareInterface}
 * @param {Context} context The execution context for the middleware stack.
 */
function AnalyzerMiddleware (context)
{
  var grunt = context.grunt;

  //--------------------------------------------------------------------------------------------------------------------
  // PUBLIC API
  //--------------------------------------------------------------------------------------------------------------------

  this.analyze = function (filesArray)
  {
    var src = util.sortFilesBeforeSubfolders (filesArray.src);

    // Load the script files and scan them for module definitions.
    src.forEach (function (path)
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
        if (!filesArray.forceInclude || !grunt.file.isMatch ({matchBase: true}, filesArray.forceInclude, path)) {
          info ('Ignored file: %', path.cyan);
          return;
        }
        context.standaloneScripts.push ({
          path:    path,
          content: script
        });
      }
      else setupModuleInfo (moduleHeader, script, path);
    });

  };

  this.trace = function (module)
  {
    /* jshint unused: vars */
    // Do nothing
  };

  this.build = function (targetScript)
  {
    /* jshint unused: vars */
    // Do nothing
  };

  //--------------------------------------------------------------------------------------------------------------------
  // PRIVATE
  //--------------------------------------------------------------------------------------------------------------------

  /**
   * Store information about the specified module retrieved from the given source code on the specified file.
   *
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
        var module = context.modules[moduleHeader.name];
        // If this is the first time a specific module is mentioned, create the respective information record.
        if (!module)
          module = context.modules[moduleHeader.name] = new ModuleDef ();
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
        module.configFn = moduleHeader.configFn;
        break;

      case STAT.MULTIPLE_MODULES:

        warn ('Definitions for multiple modules were found on the same file.' + NL + reportErrorLocation (filePath));
        break;

      case STAT.MULTIPLE_DECLS:

        warn ('More than one module declaration was found on the same file.' + NL + reportErrorLocation (filePath));
    }
  }

}
