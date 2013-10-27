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

> Note: in this documentation, whenever I say 'context' (as in 'wrap code in an isolated context'), I mean a javascript **scope**. The term 'scope' is avoided to prevent it from being mistaken with the Angular concept of scope.

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

---
##### targetScript
Type `string`

Target javascript file name.  
The javascript build output will be saved to this path.

---
##### targetCSS
Type `string`

Target CSS file name.  
The packaged stylesheets will be saved to this path.    

---
##### assetsTargetFolder
Type `string`

Target folder path for publishing assets.  
Relative paths for the source files as specified in stylesheet asset urls are preserved on the output, so the required folder structure will be recreated on the output target.  
Urls on the exported stylesheets will be rebased to this folder.

---
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
##### symlinkAssets
Type `boolean`  
Default `false`

When `false`, required assets are copied to the assets target folder.

When `true`, symlinks are generated instead. This speeds up the build operation considerably, and also saves disk space.

If your operating system does not support symlinks, or if you want to archive or upload the build output, use `false`.

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

```js
module.exports = function (grunt)
{
  grunt.initConfig ({

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

```js
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

```js
module.exports = function (grunt)
{
  grunt.initConfig ({

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

## How the build process works

These are the steps the build tool performs:

#### Common steps

1. Scan all files on the configured source folders.

2. Map the dependency graph between the declared modules, starting from the configured main module.
    - This will determine which source files are relevant to the current build; all other files will be ignored.

3. If a CSS target is configured, trace the stylesheet dependencies too.

#### Debug-specific build steps

If running a debug build, the following step ensues:

1. Generate one single javascript output file that will insert `<script>` and `<link>` tags into the HTML document's HEAD section, which will load all the required javascript and css original source files, in the correct order.
    - These will be loaded before other `<script>` and `<link>` tags that may already exist in the document after the loader's `<script>` tag.

#### Release-specific build steps

If running a release build, the following steps ensue:

1. Output each module to the target javascript file, in the correct order determined by the dependency graph.
    - The source code for all files that contribute to a given module is extracted.
        - If it's already wrapped by a self-invoking function, the wrapper code is discarded.
        - If it's not wrapped, analyze it to detect code running on the global scope that may change the scope's content and abort/warn if such code is found (_see why below_).
    - References to angular modules (variables or `angular.module` expressions) are refactored.
    - The transformed source code fragments are concatenated into a single block wrapped by a self-invoking function.  
      The generated code follows this pattern:  
      
          (function (exports) {
              // all code fragments will be inserted here
          }) (angular.module('name', ['module1', 'module2', ...]));
          
- Scan all relevant stylesheets for references to external assets (images and fonts).
- Copy the required assets to the configured release target folder. Alternatively, symlinks may be generated insted of copying files, if so is configured.

- Rebase urls on the stylesheets to the target assets folder.

- Output each required source stylesheet to the target CSS file, in the same order as the javascript code.

> Note: the operations above are performed independently for each **target** or **file group** specified on the Gruntfile.


## Pitfalls and Best Practices

In order to obtain the best results with the build tool, some care should be taken with how you structure your code.

#### Wrapped and unwrapped code

The recommended practice is to always wrap the code in each source file like this:

```js
(function () {

  var myPrivateVar = 1;

  angular.module ('moduleName', []).

    directive ('test', function () {
      return {
        restrict: 'E',
        link: function (scope, element, attrs) {
          return myPrivateFn ();
        }
      }
    });

  function myPrivateFn () {
  }

}) ();
```

Or like this:

```js
(function (exports) {

  var myPrivateVar = 1;

  exports.

    directive ('test', function () {
      return {
        restrict: 'E',
        link: function (scope, element, attrs) {
          return myPrivateFn ();
        }
      }
    });

  function myPrivateFn () {
  }

}) (angular.module ('moduleName', []));
```

Code like the examples above will work just fine with the builder tool.

Nevertheless, if your code consists only of module definitions, with no private functions or variables, you **don't need** to wrap it.

For example:

```js
// Valid code.

/* Comments are allowed. */

angular.module ('moduleName', []).

  service ('test', function () {
    // do something
  }).

  factory ('test2', function () {
    // do something
  }).

  directive ('test3', function () {
    return {
      restrict: 'E',
      link: function (scope, element, attrs) {
        // do something
      }
    }
  });

/** These are allowed too: */

window.name = "Hello";
console.log ("Hey!");
```

In this example source file, code is not wrapped, so the build tool will have to analyze it with more care. This **will be a little slower to build**.

The build tool will run the code in an isolated sandbox to analyze whether the code will run the same way on debug builds and on release builds.

> On release builds, each module's code is wrapped in an isolated context.  
> On debug builds, code runs as it is.

Statements like those two lines at the end of the example above will be accepted, as they will perform the same way whether wrapped or not.

But the following code will be rejected, as it could have unintended side effects when transformed for a release build:

```js
// Dangerous code.

// These variables may be used elsewhere, as they are global.
var x = 1;
e = 1;

angular.module('moduleName', []).

  service ('test2', function () {
    return myPrivateFn3 ();
  });

// This function may be called elsewhere, as it is global.
function myPrivateFn3 () {
}
```

Here, three identifiers are added to the global scope: `x`, `e` and `myPrivateFn3`.  
When running on a release build, those identifiers **will not** be added to the global scope. This may, or may not, have unintended consequences.

> You may force the build tool to accept this kind of source code by running the `grunt` command with the `--force` option.

#### Split your modules into several files

Don't create gigantic monolithic module files!

The main reason for using a build tool is to be able to split your code into as many files as you need, to make it more organized and simpler to understand.

One way to organize your code is to create a folder for each module.  
Inside that folder, you may create additional folders to group related functionality.  
You may also nest some modules inside others, if you need to.

Split your module's code into as many files as you want.  
You can put many services and directives per file, or you may create a file for each service or directive, or you can mix both approaches.  
Do what feels best for you.

**One thing you shouldn't do, though, is to mix declarations for more than one module in the same source file!**  

> The build tools accepts no more than one single module reference per source file.

Example directory structure (not mandatory):

```
src
 |--module1
 |  |--services
 |  |    service1.js
 |  |    services2_and_3.js
 |  |--directives
 |  |    my_directives.js
 |  |    some_other_directive.js
 |  |--modules
 |  |  |--submodule A
 |  |  |  |--services
 |  |  |  |    ...
 |  |  |  |--directives
 |  |  |  |    ...
 |  |  |  |--other-stuff
 |  |  |  |    ...
 |  |  |--submodule B
 |  |  |    ...
 |--module2
 |  ...
```

**You can, of course, organize your code in any way you want**. The build tool should be able to find and assemble all the related code, no matter into how many files and folders deep it was split to, or in which order they are read.

#### Take care with module references

To avoid redundancy and generate shorter code, the build tool replaces multiple references to the same angular module with variables.

Suppose you have the following three files:

- One that declares the module:

```js
angular.module ('moduleName', []).

  service ('test', function () {
    // do something
  });
  
```

- Another one that extends it with additional definitions:

```js
angular.module ('moduleName').

  factory ('test2', function () {
    // do something
  });

angular.module ('moduleName').constant ('X', 123);
```

- And another one that is wrapped in an isolated context:

```js
(function (mod) {
  var private1;
  
  mod.service ('test4', function () {
    // do something
  });

  function private2 () {}
   
}) (angular.module('moduleName'));
```


These would be assembled like this:

```js
(function (exports) {

  exports.service ('test', function () {
    // do something
  });

  exports.factory ('test2', function () {
    // do something
  });

  exports.constant ('X', 123);

  var private1;
  
  exports.service ('test4', function () {
    // do something
  });

  function private2 () {}
   
}) (angular.module('moduleName', []));
```

As you can see, the build tool had to unwrap the content of file 3, and then rename the module reference from `mod` to the preconfigured name `exports`.

> You can set your preferred name for module references using the `moduleVar` task configuration option.

The example above would build just fine, although you may need to enable `renameModuleRefs`, otherwise the build will stop with a warning.  
This is so because the renaming method used by the build tool is very basic, and sometimes it may rename other things with the same name that should not be renamed. So you should only enable this functionality if you take some care.   

> I may consider, in the future, including a full javascript parser in the project to improve source code transformation, but for now, all code transformations are made without needing one and it works quite nicely as it is, and it is **much faster** this way. So, let's see if I can avoid doing that ;-)

**I recommend that you always use the same variable name for module references.**
It's safer that way.

#### Don't assign module references to variables

Don't do this:

```js
var mod = angular.module('moduleName', []);

mod.service ('test', function () {
    // do something
  });
```

Instead, use the method explained in the [first topic](#wrapped-and-unwrapped-code).

#### When the build fails, enable verbose mode

More information is usually available when you run the `grunt` command with the `-v` option.

You may also force it to ignore some errors by specifying the `--force` option on the command line.

## Release History

See the [CHANGELOG](CHANGELOG).

## Author

#### Cláudio Silva
- [GitHub profile](http://github.com/claudio-silva)
- [LinkedIn profile](http://www.linkedin.com/pub/cl%C3%A1udio-silva/7/713/367)
