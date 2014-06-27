'use strict';

var MATCH_URLS = /\burl\s*\(\s*('|")?\s*(.*?)\s*\1?\s*\)/gi;

module.exports = AssetsMiddleware;

var util = require ('../lib/gruntUtil')
  , path = require ('path')
  , fs = require ('fs');

/**
 * Exports the assets required by the application's modules.
 * @constructor
 * @implements {MiddlewareInterface}
 * @param {Context} context The execution context for the build pipeline.
 */
function AssetsMiddleware (context)
{
  var grunt = context.grunt;

  /**
   * Records which files have been already exported.
   * Prevents duplicate asset exports.
   * It's a map of absolute file names to boolean `true`.
   * @type {Object.<string,boolean>}
   */
  var exportedAssets = {};

  //-------------------------------------------------------------------------------------------------------------------
  // PUBLIC API
  //-------------------------------------------------------------------------------------------------------------------

  /**
   * @inheritDoc
   */
  this.analyze = function (filesArray)
  {
    /* jshint unused: vars */
    // Do nothing
  };

  /**
   * @inheritDoc
   */
  this.trace = function (module)
  {
    /* jshint unused: vars */
    // Do nothing.
  };

  /**
   * @inheritDoc
   * @param {string} targetScript Path to the output script.
   */
  this.build = function (targetScript)
  {
    if (!context.options.buildAssets) return;
    var stylehseets = grunt.config (context.options.stylesheetsConfigProperty); // Import file paths.
    if (!stylehseets) return; // No stylesheet sources are configured.
    var targetPath = path.dirname (targetScript);
    stylehseets.forEach (function (filePath)
    {
      var src = grunt.file.read (filePath);
      scan (path.dirname (filePath), targetPath, src);
    });

  };

  //-------------------------------------------------------------------------------------------------------------------
  // PRIVATE
  //-------------------------------------------------------------------------------------------------------------------

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
          , absDestPath = path.resolve (targetPath, context.options.assetsTargetDir, url)
          , relDestPath = path.relative (targetPath, absDestPath);
        if (relDestPath[0] === '.')
          return util.warn ('Relative asset url falls outside the build folder: <cyan>%</cyan>%', url, util.NL);
        if (exportedAssets[absDestPath]) // skip already exported asset
          continue;
        else exportedAssets[absDestPath] = true;
        var absTargetFolder = path.dirname (absDestPath);
        grunt.file.mkdir (absTargetFolder);
        if (context.options.symlinkAssets)
          fs.symlinkSync (absSrcPath, absDestPath);
        else grunt.file.copy (absSrcPath, absDestPath);
      }
    }
  }

}

