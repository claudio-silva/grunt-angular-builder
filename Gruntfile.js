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
  require('time-grunt')(grunt);

  // Project configuration.
  grunt.initConfig ({

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
      'test-js-only': {
        src:          'tests/js-only/**/*.js',
        targetScript: 'dist/main.js'
      },
      'test-js-fail': {
        options:            {
          main: 'App2'
        },
        src:          'tests/js-only/**/*.js',
        targetScript: 'dist/main.js'
      },
      'test-stylesheets': {
        src:          'tests/stylesheets/**/*.js',
        targetScript: 'dist/main.js',
        targetCSS:    'dist/main.css'
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

  grunt.registerTask ('test-js-only', ['clean', 'angular-build-tool:test-js-only']);
  grunt.registerTask ('test-js-fail', ['clean', 'angular-build-tool:test-js-fail']);
  grunt.registerTask ('test-stylesheets', ['clean', 'angular-build-tool:test-stylesheets']);

};