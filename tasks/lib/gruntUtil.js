/**
 * @license
 * A set of utility functions for use with Grunt.
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * Licensed under the MIT license.
 */
'use strict';

var util = require ('./util');

var csprintf = util.csprintf
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
exports.init = function (gruntInstance) {
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
 * Arguments are the same as the ones on <code>sprintf</code>.
 */
exports.fatal = function ()
{
  grunt.fail.fatal (csprintf.apply (null, ['red'].concat ([].slice.call (arguments))));
};

/**
 * Displays an error message and, if --force is not enabled, stops execution.
 * Arguments are the same as the ones on <code>sprintf</code>.
 */
exports.warn = function ()
{
  grunt.fail.warn (csprintf.apply (null, ['yellow'].concat ([].slice.call (arguments))));
};

/**
 * Displays a message.
 * Arguments are the same as the ones on <code>sprintf</code> but supports color tags like <code>csprintf</code>.
 */
exports.writeln = function ()
{
  grunt.log.writeln (csprintf.apply (null, ['white'].concat ([].slice.call (arguments))));
};

/**
 * Returns the given message colored grey if running in verbose mode otherwise, returns a generic short message.
 * @param {string} msg
 * @returns {string}
 */
exports.info = function (msg)
{
  return (verbose ? indent (csprintf ('grey', msg)) : '  Use -v for more info.'.grey) + NL;
};
