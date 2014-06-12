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

8. It can also include in the build scripts that are not based on AngularJS. It can even perform dependency resolution on those files so that your application's modules can *require* specific javascript libraries, and those libraries, in turn, can *require* other libraries. 

9. Recognizes modules and libraries that are loaded independently and, therefore, are not part of the build.

10. Not only builds complete applications but also builds library projects, generating _readable_ redistributable source code files for them.

11. Integrates easily with other Grunt plugins to expand your build process with minification, optimization, preprocessing and/or compilation steps.

12. It has its own internal plugins (called 'extensions'). All the bundled functionality is provided by **8 internal extensions**. You can also **easily** write your own extensions to augment angular-builder's capabilities (or even replace them).

### Roadmap

**The project is almost feature-complete.  
It is being used in production on real projects right now.**

   | Status      | Feature
---|:------------|:-----------
 1 | Done        | Javascript release and debug builder.
 2 | Done        | Integration with CSS building tasks.
 3 | Done        | Integration with HTML templates building tasks.
 4 | Done        | Assets builder.
 5 | Done        | Non-module-based / non-angular-code javascript builder.
 6 | Done        | Source paths export for extended integration with other Grunt tasks.
 7 | Done        | Plugin-based architecture.
 8 | In progress | Improve compatibility with 3rd-party libraries.
 9 | In progress | Even more documentation and more examples.

# Documentation

Extended documentation is available on the [Wiki](https://github.com/claudio-silva/grunt-angular-builder/wiki).

You can also examine the tests that are provided on the `/tests` folder and the test configurations that are defined on `/Gruntfile.js`. They are very simple working examples that you can build immediately.

### Before we start, you should know about angular-builder's limitations

##### The builder can't build source code that defines multiples modules in a single file.

It would be very hard for the builder to find out which code belongs to each module and split it when necessary when those modules are intertwined in a single file. In those cases, there is usually some code that is common to several modules and that hampers the build process.

##### The builder can't build pre-built concatenated library files.

If you are trying to include a single-file library into your build process, chances are it is a release-optimized file that is already built by some other means.

Possible solutions:

1. Use the library's original source code files.

2. Exclude it from the build process, mark it as an external module and either load it separately into your application or use an additional Grunt task to concatenate (and/or minify) it into the final build file.

3. Have angular-builder include it in the build as a *black-box* script file, by using:

	1. the `#require` directive,
	2. the `require` configuration option, or 
	3. the `forceInclude` extra file group property.

	> Angular-builder will include the file before your application's code, but will not try to parse it.

##### The builder can't build AngularJS itself!

Angular-builder can't (and shouldn't) build the Angular framework. Load it independently before your app code or have the builder include it via one the options mentioned above.

##### The builder can't directly build source code that is written in compile-to-javascript languages.

Angular-builder is unable to parse files that are not written in standard javascript.

If you want to build code written in Coffeescript, Typescript, or any other language that compiles to javascript, you must previously compile the files into a different folder and build from that folder (also put javascript third-party libraries there). 

##### Write your code freely, but with some rules.

You should have in mind that some javascript code is not "build friendly". It would be a major challenge for Angular Builder to support all the myriad ways code can be structured by other people.

Just like AMD or CommonJS require the developer to follow some rules, angular-builder also works best if you take some simple precautions.

On the Wiki you'll find a page about [writing build enabled code](https://github.com/claudio-silva/grunt-angular-builder/wiki/Writing-build-enabled-code).  
As long as you follow those rules, your application or library will build just fine.  

##### Compatibility with third-party libraries:

Third-party code that was not written in a "build-enabled" way may fail to be built. Angular-builder is smart enough to support many different coding styles and, as such, is able to build many third-party libraries that were not written with angular-builder in mind.

But some libraries will, unfortunately, fail to build (unless the authors were willing to implement some changes to make them "build-enabled").

An automated test is provided for building the standard AngularJS libraries that are optional parts of the framework.

The libraries below were tested and they build successfully:

- ngAnimate
- ngCookies
- ngResource
- ngRoute
- ngSanitize
- ngTouch
- ngLocale (the locale specific files, ex. `angular-locale_en-iso`)

`angular-mocks` is not compatible, but you shouldn't include it in a production/debug build, anyway.

For other third-party libraries, your mileage will vary. I cannot guarantee compatibility will all angular code out there and, as such, recommend that you use angular-builder mainly for your own code and your own libraries.

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

The example above includes two alias tasks registered at the bottom. These tasks are customisable shortcuts to your build process. They are a starting point for you to expand with additional subtasks provided by other Grunt plugins.

To assemble a release build of your project, run the command:
`grunt release`

For a debug build, run the command:
`grunt debug`

> These alias are just a suggestion. You may configure your Grunt tasks in any way you want.

### Integrating with other Grunt tasks

_Build-directives_ embedded in your source javascript files can direct the builder to generate lists of stylesheets and templates that are **actually** required by your modules, in the correct loading order. These file path arrays can then be used by other Grunt tasks to build the required files.  
Read the [Wiki](https://github.com/claudio-silva/grunt-angular-builder/wiki) for more information.

##### If you wish to minify/optimize your build files

You can add the respective tasks to the `release` task list, __after__ the `angular-builder` task.

##### If you wish to compile files from other languages to javascript (coffeescript, typescript, etc)

They must be compiled prior to the build step, so you should add those tasks to the `release` task list __before__ the `angular-builder` task.

### Advanced Use

Read the [Configuration examples](https://github.com/claudio-silva/grunt-angular-builder/wiki/Configuration-examples) page for additional information and examples.

### Debugging build failures

The build tool will display extended information when warnings or errors occur during the build process if you run the `grunt` command with the `-v` option.

You may also force Grunt to ignore some warnings and continue building by running `grunt` with the `--force` option (not recommended, though).

## Contributing

In lieu of a formal style-guide, take care to maintain the existing coding style.

A linter is already present on the project, so just type `grunt` to run it.

If it's appropriate, create some test cases on the `/tests` folder and include them as individual tasks on the project's Gruntfile.

Always start developing by creating a topic branch on your forked repository from the latest tagged stable version on the `master` branch.

When your work is ready, submit a pull request.

__Important:__ all contributions that are accepted will be made available under the project's license.

## Release History

[v0.4.4](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.4.4) / 2014-06-12

- Support for non-angular-module scripts inclusion and dependency resolution. New `#require` directive.
- Some refactoring and new internal extensions.
- Bug fixes.

[v0.4.3](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.4.3) / 2014-05-20

- Improved compatibility with 3rd-party libraries.
    - The standard AngularJS libraries can now be included in builds successfully.
    - Module references assignments and inline module configuration functions are supported now.
  
[v0.4.2](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.4.2) / 2014-05-17

- Improved compatibility with 3rd-party libraries.
- Bug fixes.
  
[v0.4.1](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.4.1) / 2014-05-04

- Bug fixes.
  
[v0.4.0](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.4.0) / 2014-04-20

- Major internal refactoring.
- More builder capabilities: stylesheets, templates, assets and source paths export.
  
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
