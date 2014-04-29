## angular-builder
> A better way to build AngularJS applications.

### What is Angular-Builder?

It's a Grunt plugin that handles module loading of code, stylesheets and assets dependencies of AngularJS applications in a truly practical, automated, simple and easy way.

### Why is there a need for a builder tool?

AngularJS is an amazing framework, but while it promotes modular development, it doesn't provide a solution for automatically finding all the required source files of your app and then loading them in the correct order. It lets that, humm... _"trivial"_ task up for you to solve!...

So, perhaps you're already facing one of these scenarios:

- You're manually defining your source files' include order and manually managing your modules' stylesheet and asset dependencies, but find it to be a lot of work, tedious and error-prone.

Or

- You tried to integrate AngularJS with RequireJS, Browserify or one of those other popular module loaders / optimizers /  packagers, but found it to be awkward to use an additional module dependency resolution system (with a very different philosophy) over a framework _that already has one_ (and just lacks the loading part).

Or

- You're using some hand-made custom solution but are not quite satisfied with it.

If any of these ring a bell, this tool might be the answer you were looking for!

### Features

This Grunt plugin:

1. Analyzes your AngularJS source code and "understands" module dependencies and the relationships between your files. No need for AMD or CommonJS loaders.

2. Accepts source code split into as many files as you want and spread over any directory structure you prefer.

3. Assembles one javascript file (or just a few) for production with all code assembled in the correct loading order required by your module's dependencies.

4. Builds fast in debug mode by generating a single script that loads the original source files in the correct order (no minified or concatenated files in debug builds).

5. Allows you to debug the source code in the browser itself and see readable source code for any debug breakpoint or error location, with the correct original line numbers.

6. Includes in the build _only_ the modules that your app actually needs and discards dead code.

7. Includes in the build the stylesheets and assets each module requires and excludes those that are not used by your app.

8. It can also include in the build scripts that are not based on AngularJS.

9. Recognizes modules and libraries that are loaded independently and, therefore, are not part of the build.

10. Not only builds complete applications but also builds library projects, generating _readable_ redistributable source code files for them.

11. Integrates easily with other Grunt plugins to expand your build process with minification, optimization, preprocessing and/or compilation steps.

12. It has its own internal plugins (called 'extensions'). All the bundled functionality is provided by 6 internal extensions. You can also **easily** write your own extensions to augment angular-builder's capabilities (or even replace them).

### Roadmap

**The project is almost feature-complete.  
It is being used in production on real projects right now.**

   | Status     | Feature
---|:-----------|:-----------
 1 | Done       | Javascript release and debug builder.
 2 | Done       | Integration with CSS building tasks.
 3 | Done       | Integration with HTML templates building tasks.
 4 | Done       | Assets builder.
 5 | Done       | Source paths export for extended integration with other Grunt tasks.
 6 | Done       | Plugin-based architecture.
 7 | To do      | Finish the documentation.

# Documentation

Extended documentation is available on the [Wiki](https://github.com/claudio-silva/grunt-angular-builder/wiki).

## Getting Started

> This plugin is available for installation from **npm**.

>**Do not donwload the source code from the git repository into your project**, for you could end up using a (possibly) very unstable development version and **not a stable release**.

Start by installing Grunt `~0.4.1` on your project.

If you haven't used [Grunt](http://gruntjs.com) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins.

Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-angular-builder --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-angular-builder');
```

## The "angular-builder" task

### Overview
In your project's Gruntfile, add a section named `angular-builder` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  'angular-builder': {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

The available options are explained in the [Configuring tasks](https://github.com/claudio-silva/grunt-angular-builder/wiki/Configuring-tasks) page.

### Basic Use

This is the minimal recommended `Gruntfile.js`.

```js
module.exports = function (grunt)
{
  grunt.initConfig ({

    'angular-builder': {
      options: {
        main: 'mainModuleName'
      },
      app: {
        src:  'src/**/*.js',
        dest: 'build/project.js'
      }
    }

  });
  
  grunt.loadNpmTasks ('grunt-angular-builder');
  
  grunt.registerTask ('release', ['angular-builder']);
  grunt.registerTask ('debug', ['angular-builder::debug']);

};
```

### Running tasks

To run the above task:

- For a releast build, type `grunt angular-builder` on the command line;
- For a debug build, type either:
    - `grunt angular-builder::debug`, or
    - `grunt angular-builder --build=debug`.

If you define your own alias tasks with more complex build steps, run `grunt your-task-name` instead.

> Tip: you can use the `--build=debug` option to convert any task alias into a _debug_ build (assuming it includes an angular-builder subtask).

### The recommended tasks alias

The example above includes two alias tasks registered at the bottom. These tasks are customizable shortcuts to your build process. They are a starting point for you to expand with additional subtasks provided by other Grunt plugins.

To assemble a release build of your project, run the command:
`grunt release`

For a debug build, run the command:
`grunt debug`

> These alias are just a suggestion. You may configure your Grunt tasks in any way you want.

### Integrating with other Grunt tasks

If you wish to minify/optimize your build files, you can add the respective tasks to the `release` task list, __after__ the `angular-builder` task.

If you wish to compile files from other languages to javascript (coffeescript, typescript, etc), they must be compiled prior to the build step, so you should add those tasks to the `release` task list __before__ the `angular-builder` task.

Build-directives embedded in your source javascript files can direct the Builder to generate lists of stylesheets and templates that are **actually** required by your modules, in the correct loading order. These file path arrays can then be used by other Grunt tasks to build the required files.  
Read the Wiki for more information.

### Advanced Use

Read the [Configuration examples](https://github.com/claudio-silva/grunt-angular-builder/wiki/Configuration-examples) page for additional information and examples.

### Debugging build failures

 The build tool will display extended information when warnings or errors occur during the build process if you run the `grunt` command with the `-v` option.

You may also force Grunt to ignore some warnings and continue building by running `grunt` with the `--force` option (not recommended, though).

## Contributing

In lieu of a formal style-guide, take care to maintain the existing coding style.

A linter is already present on the project, so just type `grunt` to run it.

If it's appropriate, create some test cases on the `/test` folder and include them as individual tasks on the project's  Gruntfile.

Always start developing by creating a topic branch on your forked repository from the latest tagged stable version on the `master` branch.

When your work is ready, submit a pull request.

__Important:__ all contributions that are accepted will be made available under the project's license.

## Release History

[v0.4.0](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.4.0) / 2014-04-20

- Angular Builder is now feature-complete.
  
[v0.3.0](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.3.0) / 2014-03-29

- Added support for multiple patterns on rebaseDebugUrls. Breaks compatibility with previous version.
  
[v0.2.0](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.2.0) / 2014-03-29

- Bug fixes. Configuration (breaking) changes. Updated documentation.
  
[v0.1.3](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.1.3) / 2013-11-25  

- The project was renamed.
  
[v0.1.2](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.1.2) / 2013-11-04  

- Major internal refactoring.
- Bug fixes.
- More options.
  
[v0.1.1](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.1.1) / 2013-10-31  

- Documentation updates.
  
[v0.1.0](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.1.0) / 2013-10-29

- Javascript build support.

## Author

#### Cláudio Silva
- [GitHub profile](http://github.com/claudio-silva)
- [LinkedIn profile](http://www.linkedin.com/pub/cl%C3%A1udio-silva/7/713/367)
