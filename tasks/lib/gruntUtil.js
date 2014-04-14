/**
 * @license
 * A set of utility functions for use with Grunt.
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

var nodeUtil = require ('util');

/*
 * Get color and style in your node.js console.
 * Note: requiring this here modifies the String prototype!
 */
require ('colors');

/**
 * OS dependent line terminator.
 * @type {string}
 */
var NL = process.platform === 'win32' ? '\r\n' : '\n';

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

exports.csprintf = csprintf;
exports.icsprintf = icsprintf;
exports.NL = NL;

/**
 * Initializes the gruntUtil module.
 * You MUST call this function before using most other functions in this module.
 * @param gruntInstance
 */
exports.init = function (gruntInstance)
{
  grunt = gruntInstance;
  verbose = grunt.option ('verbose');
};

/**
 * A simplified string formatting function.
 * Inserts arguments into % placeholders on the given string.
 * @param {string} str The string to be formatted.
 * @returns {string}
 */
exports.sprintf = function (str)
{
  var c = 0
    , args = [].slice.call (arguments, 1);
  return str.replace (/%/g, function ()
  {
    return args[c++];
  });
};

/**
 * Outputs debug information to the console.
 * @param {...*} args
 */
exports.debug = function ()
{
  Array.prototype.forEach.call (arguments, function (arg)
  {
    console.log (nodeUtil.inspect (arg).yellow);
  });
  console.log ('');
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
  return (verbose ? exports.indent (csprintf ('grey', msg)) : '  Use -v for more info.'.grey) + NL;
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

/**
 * Generates a regular expression for matching the specified source code syntax.
 * Use spaces to match optional white space on the source code.
 * Backticks are used instead of \ to allow for cleaner syntax on regexp strings. Ex: write '`n' instead of '\\n'.
 * @param {string} syntax
 * @return {string}
 */
exports.tokenize = function (syntax)
{
  return syntax.replace (/`/g, '\\').replace (/ /g, '\\s*');
};

/**
 * Returns an array of properties on the given object and their corresponding values.
 * @param {Object} obj The object to be introspected.
 * @param {function(string,*)} callback A function that will receive each property and its corresponding
 * value from the object.
 */
exports.forEachProperty = function (obj, callback)
{
  var p = [];
  for (var prop in obj)
    if (obj.hasOwnProperty (prop))
      callback (prop, obj[prop]);
  return p;
};

/**
 * Returns a comma-separated list of quoted strings from an array.
 * @param {Array.<string>} array
 * @returns {string}
 */
exports.toQuotedList = function (array)
{
  return array.length ? "['" + array.join ("', '") + "']" : "[]";
};

/**
 * Indents each line in the given text.
 * @param {string} text The text to be indented.
 * @param {number} [level=1] Indentation depth level.
 * @param {string} [indentStr="&nbsp;&nbsp;"] A white space string that represents each indentation level
 * (ex. spaces or tabs).
 * @return {string}
 */
exports.indent = function (text, level, indentStr)
{
  return text.split (/\r?\n/).map (function (line)
  {
    return line.trim () && (exports.strRepeat (indentStr || '  ', level || 1) + line);
  }).join ('\n');
};

/**
 * Repeats a string as many times as specified.
 * @param {string} str The string to be repeated.
 * @param {number} num How many times to repeat.
 * @returns {string}
 */
exports.strRepeat = function (str, num)
{
  return new Array (num + 1).join (str);
};

/**
 * Appends the second array into the first one, in-place.
 * @param {Array} target
 * @param {Array} src
 * @returns {Number}
 */
exports.arrayAppend = function (target, src)
{
  return Array.prototype.push.apply (target, src);
};

//------------------------------------------------------------------------------
// PRIVATE
//------------------------------------------------------------------------------

/**
 * Colorized sprintf.
 * Formats a string with color and injects values into placeholders.
 * Placeholders are represented by the symbol %.
 * To colorize, use markup with the syntax: <code>&lt;color_name>text&lt;/color_name></code>
 * Warning: do not nest color tags!
 * @param {string} baseColor The base color for the string. Segments with other colors will resume the base color where
 * they end.
 * @param {string} str The string to be formatted.
 * @param {...string|...number} args Values for each placeholder in <code>str</code>.
 * @returns {string}
 */
function csprintf (baseColor, str, args)
{
  /*jshint unused:false */
  str = exports.sprintf.apply (null, [].slice.call (arguments, 1));
  str = str.replace (/<(\w+)>([\s\S]*?)<\/\1>/g, function (m, m1, m2)
  {
    if (m1 === 'bold' || m1 === 'underline')
      m2 = m2[baseColor];
    return '±' + m2[m1] + '§';
  });
  str = str.replace (/^([\s\S]*?)±|§([\s\S]*?)±|§([\s\S]*?)$/g, function (m, m1, m2, m3)
  {
    var s = m1 || (m2 || '') || (m3 || '');
    return s ? s[baseColor] : s;
  });
  return str[baseColor];
}

/**
 * @private
 * Similar to <code>csprintf</code> but supports an <code>args</code> argument that should receive a function's
 * <code>arguments</code> array-like object.
 *
 * @param {string} baseColor Color name.
 * @param {Object} args Should be a function's <code>arguments</code> array-like object.
 * @returns {string}
 */
function icsprintf (baseColor, args)
{
  return exports.csprintf.apply (null, [baseColor].concat ([].slice.call (args)));
}

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
