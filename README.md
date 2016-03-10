## Angular Builder
> Build your AngularJS applications the Angular way!

#### Warning

> **This project applies to Angular 1.x only!**

> With Angular 2.x it is not needed.

#### Warning

> **This project is on maintenance mode.**

> I feel a little sad that so much work is being shelved, but with Angular 2 making this build process obsolete, there's no reason for me to keep working on it.  
> Angular Builder, as it is, works fine for us, and we're not developing new apps with it.

> This means, **I'm not accepting any new feature requests nor any pull-requests for new features.**

> I hope Angular Builder has been useful to you, and thank you for using it.

### What is Angular Builder?

Angular Builder is the definitive solution for loading source code in AngularJS applications.

Angular Builder **is not**, itself, a script loader or a module loader; it transforms your application so that it can be **loaded directly by Angular's builtin module loader**.

This allows you to write only pure AngularJS code, free from any alien module definition/import patterns from non-Angular module specifications (like AMD, CommonJS or ES6 modules).

It also provides advanced building capabilities for:

- performing source code transformations and optimizations,
- integrate stylesheets, templates and assets dependencies into your build.

### Elevator pitch

Forget AMD, CommonJS or ES6 module loaders when developing medium to large AngularJS applications!

Now you can write your code the way it was meant to be written, using only AngularJS native constructs, as if no module loading is required or necessary!

Stop worrying about connecting all your project's myriad files into a cohesive whole. Split your code into as many files as needed, organized into any directory structure style you wish, and let Angular Builder do the *Grunt* work for you ;-), while you concentrate on writing actual useful code!


### Features

Angular Builder brings you much more than source code /assets loading.

Read the [Features](https://github.com/claudio-silva/grunt-angular-builder/wiki/Features) page to get a better understanding of what Angular Builder can do for you.

### Show your support

If you use Angular-Builder, please [star](https://github.com/claudio-silva/grunt-angular-builder) the project on Github to show your support!

And **spread the word!**

A lot of people don't know about Angular Builder yet!
They'll surely thank you if you show them a way to make their lives easier when developing AngularJS applications! ;-)

# Documentation

Extended documentation is available on the [Wiki](https://github.com/claudio-silva/grunt-angular-builder/wiki).

You can also examine the tests that are provided on the `/tests` folder and the test configurations that are defined on `/Gruntfile.js`. They are very simple working examples that you can build immediately.

##### Extending Angular Builder

If you would like to develop Angular Builder extensions (middleware), you can build reference documentation for the builder's classes and functions by running (on the project's folder):

	grunt doc

Then open `doc/index.html`.

## Before we start
You should know [about angular-builder's limitations](https://github.com/claudio-silva/grunt-angular-builder/wiki/Limitations).

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
        mainModule: 'mainModuleName'
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

[v1.0.0-beta3](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v1.0.0-beta3) / 2014-12-31

- Support for multiple module definitions per file.
- Supports building more third-party libraries than before (ex: ui-router).
- Prettify code output with module comment headers.
- Easier setting of debug/release mode via task config option.

[v1.0.0-beta2](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v1.0.0-beta2) / 2014-09-23

- Bug fix.

[v1.0.0-beta1](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v1.0.0-beta1) / 2014-08-06

- Getting ready for the official release.

[v0.5.2](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.5.2) / 2014-08-04

- Bug fixes.

[v0.5.1](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.5.1) / 2014-07-21

- Documentation update.

[v0.5.0](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.5.0) / 2014-07-15

- Major internal refactoring; middleware-based architecture.
- Adds support for setting the main module's dependencies via configuration options, which simplifies the building of large, modular applications.
- New configuration options.

[v0.4.5](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.4.5) / 2014-06-12

- Hotfix release.

[v0.4.4](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.4.4) / 2014-06-12

- Support for non-angular-module scripts inclusion and dependency resolution. New `#require` directive.
- Some refactoring and new internal extensions.
- Bug fixes.
- Improved docs.

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
