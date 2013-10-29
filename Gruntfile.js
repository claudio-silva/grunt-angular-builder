/*
 * grunt-angular-build-tool
 * https://github.com/claudio-silva/grunt-angular-build-tool
 *
 * Copyright (c) 2013 Cláudio Silva
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt)
{

  // Project configuration.
  grunt.initConfig ({
    conf: {
      testDir: 'test/manual-tests'
    },

    jshint: {
      all:     [
        'Gruntfile.js',
        'tasks/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean:  {
      tests: ['tmp', 'dist']
    },

    'angular-build-tool': {
      options:            {
        main: 'App'
      },
      'test-stylesheets': {
        src:          '<%=conf.testDir%>/build-stylesheets/src/**/*.js',
        targetScript: 'dist/test-build-stylesheets.js',
        targetCSS:    'dist/test-build.stylesheets.css'
      }
    }


  });

  // Load this plugin's task(s).
  grunt.loadTasks ('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks ('grunt-contrib-jshint');
  grunt.loadNpmTasks ('grunt-contrib-clean');

  // By default, lint and run all tests.
  grunt.registerTask ('default', ['jshint']);

  // Test tasks below can also be executed with the command line option `--build debug` to generate debug builds.

  grunt.registerTask ('test-stylesheets', ['clean', 'angular-build-tool:test-stylesheets']);

};