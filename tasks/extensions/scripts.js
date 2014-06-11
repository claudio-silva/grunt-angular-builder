'use strict';

var util = require ('../lib/gruntUtil');

var MATCH_DIRECTIVE = /\/\/#\s*require\s*\((.*?)\)/g;

module.exports = ScriptsExtension;

/**
 * Exports the paths of all extra scripts required explicitly by build-directives,
 * in the order defined by the modules' dependency graph.
 * @constructor
 * @implements {ExtensionInterface}
 * @param grunt The Grunt API.
 * @param {TASK_OPTIONS} options Task configuration options.
 * @param {boolean} debugBuild Debug mode flag.
 */
function ScriptsExtension (grunt, options, debugBuild)
{
  /* jshint unused: vars */

  var path = require ('path');

  /**
   * Paths of the required scripts.
   * @type {string[]}
   */
  var paths = [];

  /**
   * File content of the required scripts.
   * @type {string[]}
   */
  var sources = [];

  /**
   * Map of required script paths, as they are being resolved.
   * Prevents infinite recursion and redundant scans.
   * Note: paths will be registered here *before* being added to `paths`.
   * @type {Object.<string,boolean>}
   */
  var references = {};

  /**
   * @inheritDoc
   */
  this.trace = function (module)
  {
    util.info ("Scanning <cyan>%</cyan> for non-angular script dependencies...", module.name);
    scan (module.head, module.filePaths[0]);
    module.bodies.forEach (function (path, i)
    {
      scan (path, module.filePaths[i + 1]);
    });
  };

  /**
   * @inheritDoc
   * @param {string} targetScript Path to the output script.
   * @param {Array.<{path: string, content: string}>} standaloneScripts
   */
  this.build = function (targetScript, standaloneScripts)
  {
    var scripts = paths.map (function (path, i)
    {
      return {
        path:    path,
        content: sources[i]
      };
    });
    util.arrayAppend (standaloneScripts, scripts);
    if (standaloneScripts.length) {
      var list = standaloneScripts.map (function (e, i) { return '  ' + (i + 1) + '. ' + e.path; }).join (util.NL);
      util.info ("Required non-angular scripts:%<cyan>%</cyan>", util.NL, list);
    }
  };

  /**
   * Extracts file paths from embedded comment references to scripts and appends them to `paths`.
   * @param {string} sourceCode
   * @param {string} filePath
   */
  function scan (sourceCode, filePath)
  {
    /* jshint -W083 */
    var match
      , r = new RegExp (MATCH_DIRECTIVE);
    while ((match = r.exec (sourceCode))) {
      match[1].split (/\s*,\s*/).forEach (function (s)
      {
        var m = s.match (/(["'])(.*?)\1/);
        if (!m)
          util.warn ('syntax error on #script directive on argument ...<cyan> % </cyan>...%At <cyan>%</cyan>\t',
            s, util.NL, filePath);
        else {
          var url = m[2];
          var requiredPath = path.normalize (path.dirname (filePath) + '/' + url);
          // Check if this script was not already referenced.
          if (!references[requiredPath]) {
            references[requiredPath] = true;
            var source = grunt.file.read (requiredPath);
            // First, see if the required script has its own 'requires'.
            // If so, they must be required *before* the current script.
            scan (source, requiredPath);

            // Let's register the dependency now.
            paths.push (requiredPath);
            sources.push (source);
          }
        }
      });
    }
  }

}
