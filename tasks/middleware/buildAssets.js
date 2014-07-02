/**
 * Angular Builder middleware module.
 *
 * @module middleware/buildAssets
 *
 * @license
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

var util = require ('../lib/gruntUtil')
  , path = require ('path')
  , fs = require ('fs');

var MATCH_URLS = /\burl\s*\(\s*('|")?\s*(.*?)\s*\1?\s*\)/gi;

//----------------------------------------------------------------------------------------------------------------------
// OPTIONS
//----------------------------------------------------------------------------------------------------------------------

/**
 * Options specific to the Asset References Handler middleware.
 * @constructor
 */
function BuildAssetsOptions ()
{}

BuildAssetsOptions.prototype = {
  /**
   * Set to `true` to enable the assets builder.
   * @type {boolean}
   */
  enabled:   false,
  /**
   * Directory path that will be used as the reference point from where relative asset urls are calculated.
   * This determines where assets are exported to.
   * If you specify a relative path, it is resolved from the current filegroup's destination folder.
   * @type {string}
   */
  targetDir: '',
  /**
   * When `false`, required assets are copied to the assets target directory.
   *
   * When `true`, symlinks are generated instead. This speeds up the build operation considerably, and also saves disk
   * space.
   *
   * If your operating system does not support symlinks, or if you want to archive or upload the build output, use
   * `false`.
   * @type {boolean}
   */
  symlink:   true
};

/**
 * @mixin
 */
var BuildAssetsOptionsMixin = {
  /**
   * Options specific to the Asset References Handler middleware.
   * @type {BuildAssetsOptions}
   */
  assets: new BuildAssetsOptions ()
};

exports.options = BuildAssetsOptionsMixin;

//----------------------------------------------------------------------------------------------------------------------

exports.middleware = BuildAssetsMiddleware;

/**
 * Exports the assets required by the application's modules.
 * @constructor
 * @implements {MiddlewareInterface}
 * @param {Context} context The execution context for the middleware stack.
 */
function BuildAssetsMiddleware (context)
{
  var grunt = context.grunt
    , options = context.options.assets;

  /**
   * Records which files have been already exported.
   * Prevents duplicate asset exports.
   * It's a map of absolute file names to boolean `true`.
   * @type {Object.<string,boolean>}
   */
  var exportedAssets = {};

  //--------------------------------------------------------------------------------------------------------------------
  // PUBLIC API
  //--------------------------------------------------------------------------------------------------------------------

  this.analyze = function (filesArray)
  {
    /* jshint unused: vars */
    // Do nothing
  };

  this.trace = function (module)
  {
    /* jshint unused: vars */
    // Do nothing.
  };

  this.build = function (targetScript)
  {
    if (!options.enabled) return;
    // Import file paths.
    var stylehseets = grunt.config (context.options.requiredStylesheets.exportToConfigProperty);
    if (!stylehseets) return; // No stylesheet sources are configured.
    var targetPath = path.dirname (targetScript);
    stylehseets.forEach (function (filePath)
    {
      var src = grunt.file.read (filePath);
      scan (path.dirname (filePath), targetPath, src);
    });

  };

  //--------------------------------------------------------------------------------------------------------------------
  // PRIVATE
  //--------------------------------------------------------------------------------------------------------------------

  /**
   * Scans a stylesheet for asset URL references and copies the assets to the build folder.
   * @private
   * @param {string} basePath
   * @param {string} targetPath
   * @param {string} sourceCode
   */
  function scan (basePath, targetPath, sourceCode)
  {
    var match;
    while ((match = MATCH_URLS.exec (sourceCode))) {
      var url = match[2];
      if (!url.match (/^http/i) && url[0] !== '/') { // Skip absolute URLs
        var absSrcPath = path.resolve (basePath, url)
          , absDestPath = path.resolve (targetPath, options.targetDir, url)
          , relDestPath = path.relative (targetPath, absDestPath);
        if (relDestPath[0] === '.')
          return util.warn ('Relative asset url falls outside the build folder: <cyan>%</cyan>%', url, util.NL);
        if (exportedAssets[absDestPath]) // skip already exported asset
          continue;
        else exportedAssets[absDestPath] = true;
        var absTargetFolder = path.dirname (absDestPath);
        grunt.file.mkdir (absTargetFolder);
        if (options.symlink)
          fs.symlinkSync (absSrcPath, absDestPath);
        else grunt.file.copy (absSrcPath, absDestPath);
      }
    }
  }

}

