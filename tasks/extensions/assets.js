'use strict';

var MATCH_URLS = /\burl\s*\(\s*('|")?\s*(.*?)\s*\1?\s*\)/gi;

module.exports = AssetsExtension;

var util = require ('../lib/gruntUtil')
  , path = require ('path')
  , fs = require ('fs');

/**
 * Exports the assets required by the application's modules.
 * @constructor
 * @implements {ExtensionInterface}
 * @param grunt The Grunt API.
 * @param {TASK_OPTIONS} options Task configuration options.
 * @param {boolean} debugBuild Debug mode flag.
 */
function AssetsExtension (grunt, options, debugBuild)
{
  /* jshint unused: vars */

  /**
   * Records which files have been already exported.
   * Prevents duplicate asset exports.
   * It's a map of absolute file names to boolean `true`.
   * @type {Object.<string,boolean>}
   */
  var exportedAssets = {};

  /**
   * @inheritDoc
   */
  this.trace = function (module)
  {
    // Do nothing.
  };

  /**
   * @inheritDoc
   * @param {string} targetScript Path to the output script.
   * @param {Array.<{path: string, content: string}>} standaloneScripts
   */
  this.build = function (targetScript, standaloneScripts)
  {
    if (!options.buildAssets) return;
    var stylehseets = grunt.config (options.stylesheetsConfigProperty); // Import file paths.
    if (!stylehseets) return; // No stylesheet sources are configured.
    var targetPath = path.dirname (targetScript);
    stylehseets.forEach (function (filePath)
    {
      var src = grunt.file.read (filePath);
      scan (path.dirname (filePath), targetPath, src);
    });

  };

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
          , absDestPath = path.resolve (targetPath, options.assetsTargetDir, url)
          , relDestPath = path.relative (targetPath, absDestPath);
        if (relDestPath[0] === '.')
          return util.warn ('Relative asset url falls outside the build folder: <cyan>%</cyan>%', url, util.NL);
        if (exportedAssets[absDestPath]) // skip already exported asset
          continue;
        else exportedAssets[absDestPath] = true;
        var absTargetFolder = path.dirname (absDestPath);
        grunt.file.mkdir (absTargetFolder);
        if (options.symlinkAssets)
          fs.symlinkSync (absSrcPath, absDestPath);
        else grunt.file.copy (absSrcPath, absDestPath);
      }
    }
  }

}

