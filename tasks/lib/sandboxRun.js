/**
 * @license
 * A javascript source code analysis library that evaluates code in a sandboxed environment.
 * Copyright 2013 Cláudio Manuel Brás da Silva
 * http://github.com/claudio-silva
 * Licensed under the MIT license.
 */
'use strict';

/**
 * Checks if a block of javascript code performs any operation other than defining a module.
 * In order to do that, it executes the code in an isolated sandbox.
 * If any function or variable is created on the global scope as a result from that execution, a warning is issued.
 * @param {string} source Javascript code to be analized.
 * @return {false|Object} Returns false if the code is valid, otherwise returns an object with detected global scope
 * properties as keys.
 */
exports.detectInvalidSourceCode = function (source)
{
  var vm = require ('vm')
    , mockupMethod = function () { return angularModuleMockup; }
    , angularModuleMockup = {
      animation:  mockupMethod,
      config:     mockupMethod,
      constant:   mockupMethod,
      controller: mockupMethod,
      directive:  mockupMethod,
      factory:    mockupMethod,
      filter:     mockupMethod,
      provider:   mockupMethod,
      run:        mockupMethod,
      service:    mockupMethod,
      value:      mockupMethod
    }
    , noop = function () {}
    , consoleMockup = {
      assert:         noop,
      debug:          noop,
      count:          noop,
      error:          noop,
      group:          noop,
      groupCollapsed: noop,
      groupEnd:       noop,
      info:           noop,
      log:            noop,
      profile:        noop,
      profileEnd:     noop,
      time:           noop,
      timeEnd:        noop,
      timeStamp:      noop,
      trace:          noop,
      warn:           noop
    }
    , sandbox = {
      angular: {
        module: function () { return angularModuleMockup; }
      },
      console: consoleMockup,
      window:  {}
    };
  try {
    vm.runInNewContext (source, sandbox);
    delete sandbox.angular;
    delete sandbox.console;
    delete sandbox.window;
    // Check if the sandbox contains any property at all.
    /*jshint unused:false */
    for (var prop in sandbox)
      throw sandbox;
    return false;
  }
  catch (e) {
    // Code execution failed with an undefined reference or at least one new variable of function has been added to
    // the global scope.
    delete sandbox.angular;
    delete sandbox.console;
    delete sandbox.window;
    return sandbox;
  }
};

