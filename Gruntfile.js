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
      'test-js-app':              {
        options: {
          mainModule:      'App',
          externalModules: 'Library1'
        },
        src:     'tests/js-only/**/*.js',
        dest:    'dist/main.js'
      },
      'test-js-lib':              {
        options: {
          mainModule:   'Library1',
          releaseBuild: {
            renameModuleRefs: true
          }
        },
        src:     'tests/js-only/**/*.js',
        dest:    'dist/library1.js'
      },
      'test-js-fail':             {
        /** Warning: The module variable reference declare doesn't match the preset name
         on the config setting moduleVar='module'. File: tests/js-only/extra/Submodule4.js */
        options: {
          mainModule: 'Library2'
        },
        src:     'tests/js-only/**/*.js',
        dest:    'dist/library2.js'
      },
      'test-js-comments':         {
        options: {
          mainModule: 'Library3'
        },
        src:     'tests/js-only/**/*.js',
        dest:    'dist/library3.js'
      },
      'test-stylesheets':         {
        options: {
          mainModule: 'Submodule1'
        },
        src:     [
          'tests/stylesheets/submodule1/**/*.js',
          'tests/stylesheets/submodule2/**/*.js'
        ],
        dest:    'dist/main.js'
      },
      'test-assets':              {
        options: {
          mainModule: 'App',
          assets:     {
            enabled:   true,
            targetDir: 'styles',
            symlink:   true
          }
        },
        src:     'tests/stylesheets/**/*.js',
        dest:    'dist/main.js'
      },
      'test-3rd-party':           {
        options:      {
          mainModule: 'App'
        },
        src:          'tests/3rd-party/**/*.js',
        dest:         'dist/main.js',
        forceInclude: 'tests/3rd-party/angular-loader.js'
      },
      'test-include-non-angular': {
        options:      {
          mainModule: 'App'
        },
        src:          'tests/include-non-angular/**/*.js',
        dest:         'dist/main.js',
        forceInclude: 'tests/include-non-angular/other/other.js'
      },
      'test-include-and-rebase':  {
        options:      {
          mainModule: 'App',
          debugBuild: {
            rebaseDebugUrls: [
              { match: /other\//, replaceWith: '' }, //remove path segment
              { match: /tests\/include-non-angular/, replaceWith: 'js' }, //replace base path
              { match: /^.*demo.js$/, replaceWith: '' } //suppress library
            ]
          }
        },
        src:          'tests/include-non-angular/**/*.js',
        dest:         'dist/main.js',
        forceInclude: 'tests/include-non-angular/other/other.js'
      },
      'test-override-deps':       {
        options: {
          mainModule:           'App',
          overrideDependencies: {
            dependencies: ['Submodule1', 'Library1']
          }
        },
        src:     ['tests/js-only/**/*.js', '!tests/js-only/App.js'],
        dest:    'dist/main.js'
      },
      'test-slashes':             {
        options: {
          mainModule: 'App'
        },
        src:     ['tests/slashes/**/*.js'],
        dest:    'dist/main.js'
      },
      'test-ui-router':           {
        options: {
          mainModule: 'App',
          debugBuild: {
            rebaseDebugUrls: [
              { match: /tests\/ui-router\//, replaceWith: '' }
            ]
          },
          releaseBuild: {
            outputModuleNames: true,
            outputFileNames: true
          }
        },
        src:     ['tests/ui-router/**/*.js', '!tests/ui-router/comparison.js' /*not required, but let's keep it safe*/],
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
      },
      '3rd-party':        {
        src:  'tests/3rd-party/index.html',
        dest: 'dist/index.html'
      }
    },

    jsdoc: {
      dist: {
        // Force usage of JSDoc 3.3.0
        jsdoc:   "./node_modules/.bin/jsdoc",
        src:     ['tasks/**/*.js'],
        options: {
          destination: 'doc',
          configure:   'jsdoc.json'
        }
      }
    }

  });

  // Load this plugin's task(s).
  grunt.loadTasks ('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks ('grunt-contrib-jshint');
  grunt.loadNpmTasks ('grunt-contrib-clean');
  grunt.loadNpmTasks ('grunt-contrib-concat');
  grunt.loadNpmTasks ('grunt-jsdoc');

  // By default, lint and run all tests.
  grunt.registerTask ('default', ['jshint']);

  grunt.registerTask ('doc', ['jsdoc']);

  // Test tasks below can also be executed with the command line option `--build debug` to generate debug builds.

  grunt.registerTask ('test', [
    'test-js-app',
    'test-js-lib',
    //'test-js-fail',
    'test-js-comments',
    'test-stylesheets',
    'test-assets',
    'test-3rd-party',
    'test-include-non-angular',
    'test-include-and-rebase',
    'test-override-deps',
    'test-slashes',
    'test-ui-router'
  ]);

  grunt.registerTask ('test-js-app', ['clean', 'angular-builder:test-js-app']);
  grunt.registerTask ('test-js-lib', ['clean', 'angular-builder:test-js-lib']);
  grunt.registerTask ('test-js-fail', ['clean', 'angular-builder:test-js-fail']);
  grunt.registerTask ('test-js-comments', ['clean', 'angular-builder:test-js-comments']);
  grunt.registerTask ('test-stylesheets', ['clean', 'angular-builder:test-stylesheets', 'concat:test-stylesheets']);
  grunt.registerTask ('test-assets', ['clean', 'angular-builder:test-assets', 'concat:test-assets']);
  grunt.registerTask ('test-3rd-party', ['clean', 'angular-builder:test-3rd-party', 'concat:3rd-party']);
  grunt.registerTask ('test-include-non-angular', ['clean', 'angular-builder:test-include-non-angular']);
  grunt.registerTask ('test-include-and-rebase', ['clean', 'angular-builder:test-include-and-rebase::debug']);
  grunt.registerTask ('test-override-deps', ['clean', 'angular-builder:test-override-deps']);
  grunt.registerTask ('test-slashes', ['clean', 'angular-builder:test-slashes::debug']);
  grunt.registerTask ('test-ui-router-release', ['clean', 'angular-builder:test-ui-router']);
  grunt.registerTask ('test-ui-router-debug', ['clean', 'angular-builder:test-ui-router:debug']);
  grunt.registerTask ('test-ui-router', ['test-ui-router-release', 'test-ui-router-debug']);

};
