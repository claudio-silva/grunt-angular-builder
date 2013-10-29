/*
 * grunt-angular-build-tool
 * https://github.com/claudio-silva/grunt-angular-build-tool
 *
 * Copyright (c) 2013 Cláudio Silva
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({

    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    }

  });

  // Actually load this plugin's task(s).
  //grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint']);

};