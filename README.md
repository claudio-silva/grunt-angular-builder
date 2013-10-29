## grunt-angular-build-tool

> A build tool for AngularJS applications.

### Summary

This is a Grunt plugin that generates an optimized build of an AngularJS project.

For release builds, it analyzes and assembles a project's source code into a small set of files; usually one single javascript file and one single CSS file per project (application or library), plus any required assets.

For debug builds, it generates a loader script for the original javascript and CSS source files.

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

- You may also force the inclusion of non-AngularJS code in the build.

- You can even build a project that is not AngularJS based at all.
> On non-AngularJS projects, the build-tool will not be able to automatically determine the relations between the source files; you will have to annotate them with build-directives or configure forced inclusion patterns via task options. See the [Wiki](https://github.com/claudio-silva/grunt-angular-build-tool/wiki) for more info.

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

### Roadmap

1. ~~Javascript builder.~~ [done]
1. Build-directives support.
1. CSS builder.
2. Assets builder.

**The project is under active development.** More functionality will be available very soon.

---

# Documentation

Extended documentation is available on the [Wiki](https://github.com/claudio-silva/grunt-angular-build-tool/wiki).

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-angular-build-tool --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-angular-build-tool');
```

## The "angular-build-tool" task

### Overview
In your project's Gruntfile, add a section named `angular-build-tool` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  'angular-build-tool': {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

The available options are explained in the [Configuring tasks](https://github.com/claudio-silva/grunt-angular-build-tool/wiki/Configuring-tasks) page.

### Basic Use

This is the minimal recommended `Gruntfile.js`.

```js
module.exports = function (grunt)
{
  grunt.initConfig ({

    'angular-build-tool': {
      options: {
        main: 'mainModuleName'
      },
      app: {
        src:          'src/**/*.js',
        targetScript: 'build/project.js'
      }
    }

  });
  
  grunt.loadNpmTasks ('grunt-angular-build-tool');
  
  grunt.registerTask ('release', ['angular-build-tool']);
  grunt.registerTask ('debug', ['angular-build-tool::debug']);

};
```

### Running tasks

To run the above task:

- For a releast build type `grunt angular-build-tool` on the command line;
- For a debug build type either:
    - `grunt angular-build-tool::debug`, or
    - `grunt angular-build-tool --build=debug`.

If you define your own alias tasks with more complex build steps, run `grunt your-task-name` instead.

> Tip: you can use the `--build=debug` option to convert into a _debug_ build any task alias that includes an angular-build-tool subtask.

### The recommended tasks alias

The example above includes two alias tasks registered at the bottom. These tasks are customizable shortcuts to your build process. They are a starting point for you to expand with additional subtasks provided by other Grunt plugins.

To assemble a release build of your project, run the command:
`grunt release`

For a debug build, run the command:
`grunt debug`

> These alias are just a suggestion. You may configure your Grunt tasks in any way you want.

### Integrating with other Grunt tasks

If you wish to minify/optimize your build files, you can add the respective tasks to the `release` task list, __after__ the `angular-build-tool` task.

If you wish to compile files from other languages to javascript (coffeescript, typescript, etc), they must be compiled prior to the build step, so you should add those tasks to the `release` task list __before__ the `angular-build-tool` task.

If you use CSS preprocessors, you may have to add the respective tasks to both the `release` and the `debug` task lists.

### Advanced Use

Read the [Configuration examples](https://github.com/claudio-silva/grunt-angular-build-tool/wiki/Configuration-examples) page for additional information and examples.

### Debugging build failures

 The build tool will display extended information when warnings or errors occur during the build process if you run the `grunt` command with the `-v` option.

You may also force Grunt to ignore some warnings and continue building by running `grunt` with the `--force` option (not recommended, though).

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.

A linter is already present on the project, so just type `grunt` to run it.

If possible, create some test cases on the `/test` folder and include them as individual tasks on the project's  Gruntfile.

Always start developing from a stable version on the `master` branch.

> Although the main development is made on the `dev` branch, it's too unstable to be a good starting point for your own work.

Choose the latest tagged version and create a topic branch from it on your local repository.

When your work is ready, submit a pull request.

__Important:__ all contributions will be made available under the project's license.

## Release History

See the [CHANGELOG](CHANGELOG).

## Author

#### Cláudio Silva
- [GitHub profile](http://github.com/claudio-silva)
- [LinkedIn profile](http://www.linkedin.com/pub/cl%C3%A1udio-silva/7/713/367)
