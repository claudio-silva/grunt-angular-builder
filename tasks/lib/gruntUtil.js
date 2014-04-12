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
 * Sorts an array of file paths so that, for each folder, files in subfolders come BEFORE all of the folder's own files.
 * @param {string[]} filePaths sorted by Grunt's native algoritm,
 * @return {string[]} re-sorted filePaths
 */
exports.sortFilesAfterSubfolders = function (filePaths)
{
  var out = []
    , tree = createFileTree (filePaths);

  // Iterate folders.

  (function iterate (folderNode)
  {
    for (var folder in folderNode.subfolders)
      if (folderNode.subfolders.hasOwnProperty (folder))
        iterate (folderNode.subfolders[folder]);

    folderNode.files.forEach (function (file)
    {
      out.push (file);
    });
  }) (tree);

  return out;

};

/**
 * Sorts an array of file paths so that, for each folder, files in subfolders come AFTER all of the folder's own files.
 * @param {string[]} filePaths sorted by Grunt's native algoritm,
 * @return {string[]} re-sorted filePaths
 */
exports.sortFilesBeforeSubfolders = function (filePaths)
{
  var out = []
    , tree = createFileTree (filePaths);

  (function iterate (folderNode)
  {
    folderNode.files.forEach (function (file)
    {
      out.push (file);
    });

    for (var folder in folderNode.subfolders)
      if (folderNode.subfolders.hasOwnProperty (folder))
        iterate (folderNode.subfolders[folder]);
  }) (tree);

  return out;
};

/**
 * Generates a tree of folder names and file names from a (possibliy) unsorted linear list of file paths.
 * @param {string[]} filePaths
 * @returns {{files: string[], subfolders: {}}}
 */
function createFileTree (filePaths)
{
  var path = require ('path')
    , root = {
      files:      [],
      subfolders: {}
    };

  filePaths.forEach (function (filename)
  {
    var dir = path.dirname (filename)
      , folderPtr = root;
    if (dir)
      dir.split (path.sep).forEach (function (segment)
      {
        if (!folderPtr.subfolders[segment])
          folderPtr.subfolders[segment] = {
            files:      [],
            subfolders: {}
          };
        folderPtr = folderPtr.subfolders[segment];
      });
    folderPtr.files.push (filename);
  });
  return root;
}

/**
 * Writes or appends content to a file.
 * When appending it adds a newline between the concatenated content.
 * @param {string} path
 * @param {string} content
 * @param {boolean?} overwrite=false Overwrite an existing file contents instead of appending to them.
 */
exports.writeFile = function (path, content, overwrite)
{
  if (grunt.file.exists (path)) {
    if (overwrite) {
      // Re-create file.
      grunt.file.delete (path);
      grunt.file.write (path, content);
    }
    else {
      // Append to existing file.
      var data = grunt.file.read (path);
      grunt.file.write (path, data + NL + content);
    }
  }
  // Create file.
  else grunt.file.write (path, content);
};
