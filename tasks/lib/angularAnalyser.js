/**
 * @license
 * An AngularJS module source code loader and analyser.
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

var util = require ('./gruntUtil')
  , types = require ('./types')
  , sourceExtract = require ('./sourceExtract');

var ModuleDef = types.ModuleDef
  , warn = util.warn
  , reportErrorLocation = util.reportErrorLocation
  , fatal = util.fatal
  , info = util.info
  , NL = util.NL;


/**
 * Loads and analyses the specified source files.
 * @param grunt The Grunt API instance.
 * @param {FILE_GROUP_OPTIONS} fileGroup Source file paths.
 * @param {Object.<string,ModuleDef>} modules A map of module names to module definition records.
 * This is an INPUT/OUTPUT argument.
 * @param  {Array.<{path: string, content: string}>} standaloneScripts
 * A list of scripts that have no module definitions but still are forced to being included in the build.
 * This is an INPUT/OUTPUT argument.
 */
exports.run = function (grunt, fileGroup, modules, standaloneScripts)
{
  var src = util.sortFilesBeforeSubfolders (fileGroup.src);

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
      if (!fileGroup.forceInclude || !grunt.file.isMatch ({matchBase: true}, fileGroup.forceInclude, path)) {
        info ('Ignored file: %', path.cyan);
        return;
      }
      standaloneScripts.push ({
        path:    path,
        content: script
      });
    }
    else setupModuleInfo (modules, moduleHeader, script, path);
  });

};

/**
 * Store information about the specified module retrieved from the given source code on the specified file.
 *
 * @param {Object.<string,ModuleDef>} modules A map of module names to module definition records.
 * @param {ModuleHeaderInfo} moduleHeader
 * @param {string} fileContent
 * @param {string} filePath
 */
function setupModuleInfo (modules, moduleHeader, fileContent, filePath)
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

