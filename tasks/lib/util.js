/**
 * @license
 * A set of multi-purpose utility functions.
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * Licensed under the MIT license.
 */
'use strict';

/**
 * Get color and style in your node.js console.
 * Note: requiring this here modifies the String prototype!
 */
var colors = require ('colors');

//------------------------------------------------------------------------------
// PUBLIC
//------------------------------------------------------------------------------

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
 * @returns {Array.<Array.<{0:string, 1:*}>>}
 */
exports.getProperties = function (obj)
{
  var p = [];
  for (var prop in obj)
    if (obj.hasOwnProperty(prop))
      p.push ([prop, obj[prop]]);
  return p;
};

/**
 * Returns a comma-separated list of quoted strings from an array.
 * @param {Array.<string>} array
 * @returns {string}
 */
exports.toList = function (array)
{
  return array.length ? "['" + array.join ("', '") + "']" : '[]';
};

/**
 * Indents each line in the given text.
 * @param {string} text The text to be indented.
 * @param {number} [level=1] Indentation depth level.
 * @param {string} [indentStr="&nbsp;&nbsp;"] A white space string that represents each indentation level (ex. spaces or tabs).
 * @return {string}
 */
exports.indent = function (text, level, indentStr)
{
  return text.split (/\r?\n/).map (function (line)
  {
    return line.trim () && ((indentStr || '  ').repeat (level || 1) + line);
  }).join ('\n');
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
 * Colorized sprintf.
 * Formats a string with color and injects values into placeholders.
 * Placeholders are represented by the symbol %.
 * To colorize, use markup with the syntax: <code>&lt;color_name>text&lt;/color_name></code>
 * Warning: do not nest color tags!
 * @param {string} baseColor The base color for the string. Segments with other colors will resume the base color where they end.
 * @param {string} str The string to be formatted.
 * @returns {string}
 */
exports.csprintf = function (baseColor, str)
{
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
};

/**
 * Outputs debug information to the console.
 * @param {...*} args
 */
exports.debug = function ()
{
  var util = require ('util');

  Array.prototype.forEach.call (arguments, function (arg)
  {
    console.log (util.inspect (arg).yellow);
  });
  console.log ('');
};

/**
 * Repeats a string as many times as specified.
 * @param {number} num How many times to repeat.
 * @returns {string}
 */
String.prototype.repeat = function( num )
{
  return new Array( num + 1 ).join( this );
};

/**
 * OS dependent line terminator.
 * @type {string}
 */
exports.NL = process.platform === 'win32' ? '\r\n' : '\n';