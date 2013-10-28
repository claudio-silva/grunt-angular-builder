## grunt-angular-build-tool

> A build tool for AngularJS applications

### Summary

This is a Grunt plugin that generates an optimized build of an AngularJS project.

For release builds, it analyzes and assembles a project's source code into a small set of files; usually one single javascript file and one single CSS file per project (application or library), plus any required assets.

For debug builds, it generates a loader script for the original javascript and CSS source files.

You may also use this plugin for building javascript projects that are not AngularJS based. In that case, as the build-tool will not be able to automatically determine the relations between the source files, you will have to annotate them with buid-directives.  
See the [Wiki](../../wiki) for more info.

**WARNING: this project is in a early state. It's not recommended for use yet!**

## Features

#### Javascript dependency management

- Allows you to structure your project in almost any file/directory organization you want.
    - Each angular module can be spread over many source files, over many directories.
    - The only restriction is: you can't mix declarations for multiple modules in the same file.

- The build tool analyzes your code to determine which modules there are and which dependencies they have.
    - Code from unused modules is excluded from the build. This allows you to include large libraries in your project but use only the parts you need.

- The build tool assembles each module's source code into a single continuous code block per module.
    - In the process, some code may be transformed in order to:
        1. remove redundant module declarations;
        - group, under the same javascript scope, code for the same module coming from multiple files;
        - rearrange private module code to keep it under the same isolated javascript scope;
        - make sure no leakage to the javascript global scope occurs.
        
- All required modules are assembled in the correct loading order.

#### Stylesheets dependency management

- CSS stylesheets required by each module are concatenated into a single release file.
    - Only stylesheets referenced by modules included directly or indirectly in the application are included in the build.
    - The stylesheets are assembled in the same order as the modules loading order.

#### Assets management

- Assets referred to on the included stylesheets are copied to a release location.
- A folder structure is created so that all relative asset URLs on the release stylesheet will remain valid.
- You may group assets by module or put them all under the same folder. Use any organization you like.

#### Debugging support

- On debug builds, no assemblage or copying are performed but, instead, code is generated to make the browser read the original source files, in the correct loading order.
    - This allows debugging in the browser and faster write-save-refresh cycles.
    - You may continue editing your files and refreshing the browser without rebuilding (unless you create a new file or change module dependencies).

#### Other features

- _Build-directives_ are annotations wrapped in javascript documentation blocks that allow the source files to provide additional information to, or to influence, the build process. These allow a great deal of customization of the build process, with conditional inclusion/exclusion of files or source code fragments, and much more. 

- The build tool **does not** minify the generated files. It preserves the original formatting and comments of the original files, so that the generated files can be distributed as human-friendly source code.  
    - Minification / optimization should be handled by other Grunt plugins.

---

### Status

The javascript source analyzer / builder is implemented, although further testing is needed.

**The project is under active development.** More functionality will be available very soon.

### Roadmap

The next steps are:

1. Build-directives support.
1. CSS builder.
2. Assets builder.

---

# Documentation

Extended documentation is available on the [Wiki](../../wiki).

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

_To run this task directly, use the `grunt angular-build-tool` command or the `grunt angular-build-tool::debug` command._

More information is usually available when you run the `grunt` command with the `-v` option.

You may also force it to ignore some errors by specifying the `--force` option on the command line.

Before you can run any task, though, you must set up its configuration in the Gruntfile.

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

Those two alias tasks registered at the bottom are customizable shortcuts to your build process. They can be expanded with additional subtasks provided by other Grunt plugins.

To assemble a release build of your project, run the command:
`grunt release`

To setup a debug build of your project, run the command:
`grunt debug`

> If you wish to minify/optimize your build files, or use javascript/css preprocessors, you can add the respective tasks to the `release` task list, __after__ the `angular-build-tool` task.

> If you wish to compile files from other languages (coffeescript, less, etc) prior to the build step, you should add the respective tasks to the `release` task list, __before__ the `angular-build-tool` task.

### Advanced Use

Read the [Configuring Tasks](../../wiki/Configuring-Tasks) wiki page for additional information and examples .

## Release History

See the [CHANGELOG](CHANGELOG).

## Author

#### Cláudio Silva
- [GitHub profile](http://github.com/claudio-silva)
- [LinkedIn profile](http://www.linkedin.com/pub/cl%C3%A1udio-silva/7/713/367)
