## grunt-angular-build-tool

> A build tool for AngularJS applications.

### Why do I need a build tool?

If you are asking, then you don't ;-)

Now, seriously, if all you're making is a small web application, then you're probably better off putting a bunch of `script` and `link` tags on the `head` of you HTML document, and fitting your code into a few javascript, HTML and CSS files. No need to complicate your life with all this _"build"_ nonsense! ;-)

### The case for build tools

Any moderately to highly complex application needs code, _lots_ of code! And that means, dozens or hundreds of source files (unless you like editing large, monolithic files and spending most of your time scrolling and searching for things).

Also, if you want to keep your project well organized, you'll feel the need to create a well thought out directory structure for it, which will probably be many levels deep.

All those source files, in all those source folders, will need to be assembled to just a few files, at most, in order for the app to be delivered efficiently over HTTP, otherwise the browser will choke under a deluge of connections to the server to fetch all the required files.

Furthermore, modern web development also means developers frequently take advantage of stylesheet preprocessors, compile-to-javascript languages, alternative HTML formats and many other tools to simplify, accelerate and enhance the development process.

So, you'll need an automation tool that can perform all those tasks for you.

### The case for an AngularJS build tool

AngularJS is an amazing framework and one of the best for developing a modern web application. The only problem is, while Angular promotes modular development, it doesn't provide a solution for finding all the required source files of your app and loading them in the correct order. It lets that, humm, "trivial" task up to you to solve!...

So, perhaps you find yourself in one of these scenarios:

- you're manually defining your source files' include order and are fed up with it;

- you tried to integrate AngularJS with RequireJS, Browserify or one of those other popular module loaders / optimizers /  packagers, but found it to be awkward adapting a module dependency resolution system with a very different philosophy to a framework that already has one (and just lacks the loading part);

- you're using some hand-made custom solution but are not quite satisfied with it.

Now, if only someone out there made a build tool perfectly adapted to the needs of an Angular developer...

Well, that's what I thought. The problem is, I didn't find one. Oh, sure, I found many pieces that could be glued together into an ad hoc solution, but no specially crafted tool for this purpose entered my radar.

So, I decided to make one!

We are currently using it at our company for some large AngularJS projects in the area of Medical Care and Business Apps, and it made our life so much better! It's a real boost to development!

I thought this could be very useful for other developers too, so I released it as an open source project.

### Features at a glance

You're in a hurry but want to know what this is all about?

Wouldn't it be great if there was a build tool that could (check all that apply to your needs):

- Analyze your AngularJS source code and "understand" the relationships between all your files?
- Assemble one javascript file (or just a few) for production with all code assembled in the correct loading order required by your module's dependencies?
- Accept source code split into as many files as your want and on any directory structure you like?
- Generate ultra-fast debug builds that make your browser load the original source files in the correct order and allow you to debug them in the browser itself and see readable source code for any debug breakpoint or error location, with the correct original line numbers?
- Include in your build _only_ the modules that your app actually needs and discard dead code?
- Automatically include all stylesheets and assets required by each module?
- Integrate nicely with other Grunt plugins that perform minification, optimization, preprocessing and/or compilation of your source files?
- Work with non-AngularJS code and integrate it easily into your application?
- Build your project ignoring libraries that are loaded independently and therefore are not part of the build?

If you checked more than one option, then this tool is right for you.  
Give it a try!

---

### Roadmap

1. ~~Javascript builder.~~ [done]
1. Per directory build-config files support.
1. CSS builder.
2. Assets builder.

**The project is under active development.** More functionality will be available very soon.

---

# Documentation

Extended documentation is available on the [Wiki](https://github.com/claudio-silva/grunt-angular-build-tool/wiki).

## Getting Started

> This plugin is available for installation from **npm**.

>**Do not donwload the source code from the git repository into your project**, for you could end up using a (possibly) very unstable development version and **not a stable release**.

Start by installing Grunt `~0.4.1` on your project.

If you haven't used [Grunt](http://gruntjs.com) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins.

Once you're familiar with that process, you may install this plugin with this command:

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

- For a releast build, type `grunt angular-build-tool` on the command line;
- For a debug build, type either:
    - `grunt angular-build-tool::debug`, or
    - `grunt angular-build-tool --build=debug`.

If you define your own alias tasks with more complex build steps, run `grunt your-task-name` instead.

> Tip: you can use the `--build=debug` option to convert any task alias into a _debug_ build (assuming it includes an angular-build-tool subtask).

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

If it's apropriate, create some test cases on the `/test` folder and include them as individual tasks on the project's  Gruntfile.

Always start developing by creating a topic branch on your forked repository from the latest tagged stable version on the `master` branch.

When your work is ready, submit a pull request.

__Important:__ all contributions that are accepted will be made available under the project's license.

## Release History

See the [CHANGELOG](https://github.com/claudio-silva/grunt-angular-build-tool/blob/master/CHANGELOG).

## Author

#### Cláudio Silva
- [GitHub profile](http://github.com/claudio-silva)
- [LinkedIn profile](http://www.linkedin.com/pub/cl%C3%A1udio-silva/7/713/367)
