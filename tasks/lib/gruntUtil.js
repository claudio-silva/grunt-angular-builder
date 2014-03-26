/**
 * @license
 * A set of utility functions for use with Grunt.
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * Licensed under the MIT license.
 */
'use strict';

var util = require ('./util');

var csprintf = util.csprintf
  , icsprintf = util.icsprintf
  , indent = util.indent
  , NL = util.NL;

/**
 * The Grunt instance.
 */
var grunt;
/**
 * <code>true</code> if the task is running in verbose mode.
 * @type {boolean}
 */
var verbose;

//------------------------------------------------------------------------------
// PUBLIC
//------------------------------------------------------------------------------

/**
 * Initializes the gruntUtil module.
 * You MUST call this function before using any other function in this module.
 * @param gruntInstance
 */
exports.init = function (gruntInstance)
{
  grunt = gruntInstance;
  verbose = grunt.option ('verbose');
};

/**
 * Returns an error location description suitable for output.
 * @param {string} path
 * @returns {string}
 */
exports.reportErrorLocation = function (path)
{
  return csprintf ('yellow', '  File: <cyan>%</cyan>' + NL, path);
};

/**
 * Stops execution with an error message.
 * Arguments are the same as the ones on <code>sprintf</code> but supports color tags like <code>csprintf</code> does.
 * Default color is red.
 */
exports.fatal = function ()
{
  grunt.fail.fatal (icsprintf ('red', arguments));
};

/**
 * Displays an error message and, if --force is not enabled, stops execution.
 * Arguments are the same as the ones on <code>sprintf</code> but supports color tags like <code>csprintf</code> does.
 * Default color is yellow.
 */
exports.warn = function ()
{
  grunt.fail.warn (icsprintf ('yellow', arguments));
};

/**
 * Displays a message.
 * Arguments are the same as the ones on <code>sprintf</code> but supports color tags like <code>csprintf</code> does.
 * Default color is white.
 */
exports.writeln = function ()
{
  grunt.log.writeln (icsprintf ('white', arguments));
};

/**
 * Displays the given message colored grey, but only if running in verbose mode.
 * Arguments are the same as the ones on <code>sprintf</code> but supports color tags like <code>csprintf</code> does.
 * Default color is white.
 */
exports.info = function ()
{
  if (verbose)
    grunt.log.writeln (icsprintf ('white', arguments));
};

/**
 * Output additional error information for verbose mode.
 * Returns the given message colored grey if running in verbose mode otherwise, returns a generic short message.
 * @param {string} msg
 * @returns {string}
 */
exports.getExplanation = function (msg)
{
  return (verbose ? indent (csprintf ('grey', msg)) : '  Use -v for more info.'.grey) + NL;
};

/**
 * Sorts an aray of file paths so that, for each folder, files in subfolders come before all of that folder's own files.
 * @param {string[]} filePaths
 * @return {string[]}
 */
exports.sortFiles = function (filePaths)
{
  var path = require ('path')
    , folders = {}
    , out = [];
  filePaths.forEach (function (filename)
  {
    var dir = path.dirname (filename)
      , file = path.basename (filename);
    if (!folders[dir])
      folders[dir] = [];
    folders[dir].push (file);
  });
  var prevFolder = false, fileStack = [];
  for (var folder in folders)
  {
    if (prevFolder && folder.indexOf(prevFolder) < 0) {
      while (fileStack.length)
        out.push (fileStack.shift());
    }
    prevFolder = folder;
    folders[folder].forEach (function (file)
    {
      fileStack.push(folder + path.sep + file);
    });
  }
  while (fileStack.length)
    out.push (fileStack.shift());
  return out;
};
