## grunt-angular-build-tool

> A build tool for AngularJS applications

### Summary

This is a Grunt plugin that generates an optimized build of an AngularJS project.

For release builds, it analyzes and assembles a project's source code into a small set of files; usually one single javascript file and one single CSS file per project (application or library), plus any required assets.

For debug builds, it generates a loader script for the original javascript and CSS source files.

**WARNING: this project is in a early state. It's not recommended for use yet!**

## Features

#### Javascript dependency management

1. Allows you to structure your project in almost any file/directory organization you want.
    - Each angular module can be spread over many source files, over many directories.
    - The only restriction is: you can't mix declarations for multiple modules in the same file.

- The build tool analyzes your code to determine which modules there are and which dependencies they have.
    - Code from unused modules is excluded from the build. This allows you to include large libraries in your project but use only the parts you need.

- The build tool assembles each module's source code into a single continuous code block per module.
    - In the process, some code may be transformed in order to:
        1. remove redundant module declarations;
        - group, under the same context, code for the same module coming from multiple files;
        - rearrange private module code to keep it under the same isolated context;
        - make sure no leakage to the global context occurs.
        
- All required modules are assembled in the correct loading order.

#### Stylesheets dependency management

1. CSS stylesheets required by each module are concatenated into a single release file.
    - Only stylesheets referenced by modules included directly or indirectly in the application are included in the build.
    - The stylesheets are assembled in the same order as the modules loading order.

#### Assets management

1. Assets referred to on the included stylesheets are copied to a release location. All relative URLs on the assembled stylesheet will remain valid.
    - Under that location, you may group assets by module or put them all under the same folder. Use any organization you like.

- On debug builds, no assemblage or copying are performed but, instead, code is generated to make the browser read the original source files, in the correct loading order.
    - This allows debugging in the browser and faster write-save-refresh cycles.
    - You may continue editing your files and refreshing the browser without rebuilding (unless you create a new file or change module dependencies).

#### Other features

1. This plugin **does not** minify the generated files. It preserves the original formatting and comments of the original files, so that the generated files can be distributed as human-friendly source code.  
    - Minification / optimization should be handled by other Grunt plugins.

---

### Status

The javascript source analyzer / builder is implemented, although further testing is needed.

**The project is under active development.** More functionality will be available very soon.

### Roadmap

The next steps are:

1. CSS builder.
- Assets builder.

---

# Documentation

## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-angular-build-tool --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-angular-build-tool');
```

## angular-build-tool task

_Run this task with the `grunt angular-build-tool` command._

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

Do note, however, that destination targets are not set via the standard `dest` property. Instead, the destinations for each file group are specified with the following properties:

### Extra file group properties

_View examples below to understand where they should be specified._

***
##### targetScript
Type `string`

Target javascript file name. The javascript build output will be saved to this path.

***
##### targetCSS
Type `string`

Target CSS file name. The packaged stylesheets will be saved to this path.
Note: targets on Grunt file mappings are ignored, use this instead.

***
### Arguments

The build tool is a Grunt multi-task, so each property at the root level of the task configuration object is a target name.

You must, at least, define one target for the task. You may name it `'application'`, `'library'`, `'main'` or whatever you wish.

You may define additional targets to build other libraries or applications using the same Gruntfile. For instance, your application may require building additional libraries for it in a single build process.

> **Note:** I don't recommend using targets to differentiate release builds from debug builds. You should use the `debug` task argument for that (see below).  
> But if you still wish to do so, you may specify the `debug` property on an options object on each target.

If you invoke the `angular-build-tool` task with no arguments, all targets will run.

To run a specific target, append `:target-name` to the task name, like this: `angular-build-tool:application`.

To specify additional arguments for the target, append `:option1-name:option2-name:etc` to the **target** name, like this: `angular-build-tool:application:debug`.

To specify additional arguments for all targets, append `::option1-name:option2-name:etc` to the **task** name, like this: `angular-build-tool::debug`.

Currently, the only available argument is:

---
##### debug
Type `boolean`  
Default `false`

The kind of build to be generated.  
When not specified (`false`), the tool builds a single optimized javascript file with all required source code in the correct loading order.  
When specified (`true`), the tool builds a script that loads all the required source files in the correct loading order.

---
### Options

You may specify options shared by all targets or set specific options for each target, or any combination of both.

---
##### main
Type `string`

Main module name. Only this module and its dependencies will be exported.

---
##### moduleVar
Type `string`  
Default `'exports'`

Name of the variable representing the angular module being defined. This will be used inside self-invoked anonymous functions.

---
##### renameModuleRefs
Type `boolean`  
Default `false`

When <code>true</code>, angular module references passed as arguments to self-invoking functions will be renamed to <code>config.moduleVar</code>.

When <code>false</code>, if the module reference parameter has a name other than the one defined on <code>config.moduleVar</code>,
a warning will be issued and the task will stop, unless the `--force` option is specified.

---
##### debug
Type `boolean`  
Default `false`

The kind of build to be generated.  
The use of this setting as an option is, probably, not what you want.  
Use the `debug` task argument instead (see above).

---
## Usage Examples

### Basic Use

This is the minimal recommended setup.

```
module.exports = function (grunt)
{
  grunt.initConfig ({

    // ANGULAR BUILD TASK
    
    'angular-build-tool': {
      options: {
        main: 'mainModuleName'
      },
      application: {
        src:          'src/**/*.js',
        targetScript: 'build/project.js',
        targetCSS:    'build/project.css'
      }
    }

  });
  
  grunt.loadNpmTasks ('grunt-angular-build-tool');
  
  grunt.registerTask ('release', ['angular-build-tool']);
  grunt.registerTask ('debug', ['angular-build-tool::debug']);

};
```

To assemble a release build of your project, run the command:
`grunt release`

To setup a debug build of your project, run the command:
`grunt debug`

> If you wish to minify/optimize your build files, or use javascript/css preprocessors, you can add the respective tasks to the `release` task list.

#### A more sophisticated config

```
module.exports = function (grunt)
{
  var conf = {
    projectName:    'ExampleProjectName',
    mainModuleName: 'ExampleMainModuleName',
    buildPath:      'build',
    srcPath:        'src'
  };

  // Project configuration.
  grunt.initConfig ({
    conf: conf,

    // ANGULAR BUILD TASK
    
    'angular-build-tool': {
      options:     {
        main: '<%= conf.mainModuleName %>'
      },
      application: {
        files: [
          {
            src:          '<%= conf.srcPath %>/<%= conf.projectName %>/**/*.js',
            targetScript: '<%= conf.buildPath %>/<%= conf.projectName %>.js',
            targetCSS:    '<%= conf.buildPath %>/<%= conf.projectName %>.css'
          },
          {
            src:          '<%= conf.srcPath %>/library1/**/*.js',
            targetScript: '<%= conf.buildPath %>/library1.js',
            targetCSS:    '<%= conf.buildPath %>/library1.css'
          }
        ]
      }
    }

  });
  
  grunt.loadNpmTasks ('grunt-angular-build-tool');
  
  grunt.registerTask ('release', ['angular-build-tool']);
  grunt.registerTask ('debug', ['angular-build-tool::debug']);

};
```

By using a `conf` object and template expressions `<%= %>`, you can reduce repetition and aggregate common settings on a same location, therefore making it easier to reconfigure large tasks with many settings.

The example above assumes:

- Your app's files reside on the folder `src/ExampleProjectName` (or on any subfolder of it).
- A standalone library `library1` should be built from `src/library1`.
- The output is saved on `build`.  

**Note:** these paths are all relative to the `Gruntfile.js` folder (i.e. your's projects root folder).

### A multiple target example

This last example splits the build process into multiple targets.

This allows you to build each target independently, or to build them all in sequence.

```
module.exports = function (grunt)
{
  grunt.initConfig ({

    // ANGULAR BUILD TASK
    
    'angular-build-tool': {
      options: {
        main: 'mainModuleName'
      },
      application: {
        src:          'src/app/**/*.js',
        targetScript: 'build/project.js',
        targetCSS:    'build/project.css'
      },
      library1: {
        src:          'src/library1/**/*.js',
        targetScript: 'build/library1.js',
        targetCSS:    'build/library1.css'
      }
    }

  });
  
  grunt.loadNpmTasks ('grunt-angular-build-tool');
  
  grunt.registerTask ('release', ['angular-build-tool']);
  grunt.registerTask ('debug', ['angular-build-tool::debug']);

  grunt.registerTask ('release1', ['angular-build-tool:application', 'angular-build-library1']);
  grunt.registerTask ('debug1', ['angular-build-tool:application:debug', 'angular-build-library1:debug']);

  grunt.registerTask ('lib-release', ['angular-build-tool:library1']);
  grunt.registerTask ('lib-debug', ['angular-build-tool:library1:debug']);

};

```

In the example above, the tasks `release` and `release1` do the same, as do `debug` and `debug1`, they are just written in a different way.

But, while `release` builds all targets, `release1` builds just the specified ones.  
As for the `lib-release` task, only `library1` is built.

## Release History

See the [CHANGELOG](CHANGELOG).

## Author

#### Cláudio Silva
- [GitHub profile](http://github.com/claudio-silva)
- [LinkedIn profile](http://www.linkedin.com/pub/cl%C3%A1udio-silva/7/713/367)
