/*
 * grunt-angular-builder
 * https://github.com/claudio-silva/grunt-angular-builder
 *
 * Copyright (c) 2013 Cláudio Silva
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt)
{
  require ('time-grunt') (grunt);

  // Project configuration.
  grunt.initConfig ({

    jshint: {
      all:     [
        'Gruntfile.js',
        'tasks/**/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean:  {
      tests: ['tmp', 'dist']
    },

    'angular-builder': {
      'test-js-app':      {
        options: {
          main:            'App',
          externalModules: 'Library1'
        },
        src:     'tests/js-only/**/*.js',
        dest:    'dist/main.js'
      },
      'test-js-lib':      {
        options: {
          main:             'Library1',
          renameModuleRefs: true
        },
        src:     'tests/js-only/**/*.js',
        dest:    'dist/library1.js'
      },
      'test-js-fail':     {
        options: {
          main: 'Library2'
        },
        src:     'tests/js-only/**/*.js',
        dest:    'dist/library2.js'
      },
      'test-js-comments': {
        options: {
          main: 'Library3'
        },
        src:     'tests/js-only/**/*.js',
        dest:    'dist/library3.js'
      },
      'test-stylesheets': {
        options: {
          main: 'Submodule1'
        },
        src:     [
          'tests/stylesheets/submodule1/**/*.js',
          'tests/stylesheets/submodule2/**/*.js'
        ],
        dest:    'dist/main.js'
      },
      'test-assets':      {
        options: {
          main:            'App',
          buildAssets:     true,
          assetsTargetDir: 'styles',
          symlinkAssets:   true
        },
        src:     'tests/stylesheets/**/*.js',
        dest:    'dist/main.js'
      }
    },

    concat: {
      'test-stylesheets': {
        src:  '<%= requiredStylesheets %>',
        dest: 'dist/styles.css'
      },
      'test-assets':      {
        src:  '<%= requiredStylesheets %>',
        dest: 'dist/styles/styles.css'
      }
    }

  });

  // Load this plugin's task(s).
  grunt.loadTasks ('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks ('grunt-contrib-jshint');
  grunt.loadNpmTasks ('grunt-contrib-clean');
  grunt.loadNpmTasks ('grunt-contrib-concat');

  // By default, lint and run all tests.
  grunt.registerTask ('default', ['jshint']);

  // Test tasks below can also be executed with the command line option `--build debug` to generate debug builds.

  grunt.registerTask ('test', [
    'test-js-app',
    'test-js-lib',
    //'test-js-fail',
    'test-js-comments',
    'test-stylesheets',
    'test-assets'
  ]);

  grunt.registerTask ('test-js-app', ['clean', 'angular-builder:test-js-app']);
  grunt.registerTask ('test-js-lib', ['clean', 'angular-builder:test-js-lib']);
  grunt.registerTask ('test-js-fail', ['clean', 'angular-builder:test-js-fail']);
  grunt.registerTask ('test-js-comments', ['clean', 'angular-builder:test-js-comments']);
  grunt.registerTask ('test-stylesheets', ['clean', 'angular-builder:test-stylesheets', 'concat:test-stylesheets']);
  grunt.registerTask ('test-assets', ['clean', 'angular-builder:test-assets', 'concat:test-assets']);

};