## angular-builder

> Assembles all files of an AngularJS project into an optimized, release-ready set.

<br>
AngularJS is an amazing framework, but while it promotes modular development, it doesn't provide a solution for automatically finding all the required source files of your app and then loading them in the correct order. It lets that, humm... _"trivial"_ task up for you to solve!...

Furthermore, you'll have to manually manage your modules' stylesheet and asset dependencies, and also manually load additional non-angular scripts and stylesheets needed by your application.

If you're already using Grunt, you may have come up with an _ad hoc_ solution to solve these problems (ex: by adapting your code so that it can be handled by an AMD or CommonJS loader), but wouldn't you rather have a specially engineered Grunt plugin handle all of that for you in a truly practical, automated, simple and easy way?

That is precisely what 'angular-builder' does.

### Features

This Grunt plugin:

1. Analyzes your AngularJS source code and "understands" module dependencies and the relationships between your files. No need for AMD or CommonJS loaders.

2. Accepts source code split into as many files as you want and spread over any directory structure you prefer.

3. Assembles one javascript file (or just a few) for production with all code assembled in the correct loading order required by your module's dependencies.

4. Builds fast in debug mode by generating a single script that loads the original source files in the correct order (no minified or concatenated files in debug builds).

5. Allows you to debug the source code in the browser itself and see readable source code for any debug breakpoint or error location, with the correct original line numbers.

6. Includes in the build _only_ the modules that your app actually needs and discards dead code.

7. Includes in the build the stylesheets and assets each module requires and excludes those that are not used by your app.

8. Can also include in the build scripts that are not based on AngularJS.

9. Recognizes modules and libraries that are loaded independently and, therefore, are not part of the build.

10. Not only builds complete applications but also builds library projects, generating _readable_ redistributable source code files for them.

11. Allows each module to have its own build configuration file. Just drag-and-drop a module to your project and it's ready to build!

12. Integrates easily with other Grunt plugins to expand your build process with minification, optimization, preprocessing and/or compilation steps.

---

### Roadmap

1. ~~Javascript builder.~~ [done]
2. Per directory build-config files support.
3. CSS builder.
4. Assets builder.

**The project is under active development.**  
More functionality will be available soon.

---

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
        src:          'src/**/*.js',
        targetScript: 'build/project.js'
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

If you use CSS preprocessors, you may have to add the respective tasks to both the `release` and the `debug` task lists.

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

[v0.1.3](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.1.3) / 2012-11-25  

- The project was renamed.
  
[v0.1.2](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.1.2) / 2012-11-04  

- Major internal refactoring.
- Bug fixes.
- More options.
  
[v0.1.1](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.1.1) / 2012-10-31  

- Documentation updates.
  
[v0.1.0](https://github.com/claudio-silva/grunt-angular-builder/releases/tag/v0.1.0) / 2012-10-29

- Javascript build support.

## Author

#### Cláudio Silva
- [GitHub profile](http://github.com/claudio-silva)
- [LinkedIn profile](http://www.linkedin.com/pub/cl%C3%A1udio-silva/7/713/367)
