/**
 * An AngularJS source code loader and analyser.
 *
 * @module middleware/analyzeSourceCode
 *
 * @license
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

exports.middleware = AnalyzeSourceCodeMiddleware;

var util          = require ('../lib/gruntUtil')
  , types         = require ('../lib/types')
  , sourceExtract = require ('../lib/sourceExtract');

var ModuleDef           = types.ModuleDef
  , warn                = util.warn
  , reportErrorLocation = util.reportErrorLocation
  , fatal               = util.fatal
  , info                = util.info
  , NL                  = util.NL;

/**
 * An AngularJS source code loader and analyser middleware.
 *
 * @constructor
 * @implements {MiddlewareInterface}
 * @param {Context} context The execution context for the middleware stack.
 */
function AnalyzeSourceCodeMiddleware (context)
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
      // Read the script and scan it for module declarations.
      var script = grunt.file.read (path);
      /** @type {ModuleHeaderInfo[]} */
      var moduleHeaders;
      try {
        moduleHeaders = sourceExtract.extractModuleHeaders (script);
      }
      catch (e) {
        if (typeof e === 'string')
          return warn (e + NL + reportErrorLocation (path));
        throw e;
      }

      // Ignore irrelevant files.
      if (!moduleHeaders.length) {
        if (!filesArray.forceInclude || !grunt.file.isMatch ({matchBase: true}, filesArray.forceInclude, path)) {
          info ('Ignored file: %', path.cyan);
          return;
        }
        context.standaloneScripts.push ({
          path:    path,
          content: script
        });
      }
      else moduleHeaders.forEach (function (header)
      {
        setupModuleInfo (header, script, path);
      });
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
    // Get information about the specified module.
    var module = context.modules[moduleHeader.name];
    // If this is the first time a specific module is mentioned, create the respective information record.
    if (!module)
      module = context.modules[moduleHeader.name] = new ModuleDef (moduleHeader.name);
    // Skip the file if it defines an external module.
    else if (module.external)
      return;
    // Reject additional attempts to redeclare a module (only appending is allowed).
    else if (module.head && !moduleHeader.append)
      fatal ('Can\'t redeclare module <cyan>%</cyan>', moduleHeader.name);
    // The file is appending definitions to a module declared elsewhere.
    if (moduleHeader.append) {
      // Append the file path to the paths list.
      if (!~module.bodyPaths.indexOf (filePath)) {
        module.bodies.push (fileContent);
        module.bodyPaths.push (filePath);
      }
    }
    // Otherwise, the file contains a module declaration.
    else {
      if (module.head)
        fatal ('Duplicate module definition: <cyan>%</cyan>', moduleHeader.name);
      module.head = fileContent;
      module.headPath = filePath;
      module.requires = moduleHeader.requires;
    }
    module.configFn = moduleHeader.configFn;
  }

}
