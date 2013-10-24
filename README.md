# AngularJS Packager

This is a Grunt plugin that generates an optimized build of an AngularJS project.

For release builds, it analyzes and assembles a project's source code into a small set of files (usually one single javascript file and one single CSS file, plus any required assets).

For debug builds, it generates a loader script for the original source files.

### Features

- All required modules are assembled on the correct loading order, unused code is discarded.
- Some small source code transformations are performed to generate an optimized release file.
- CSS stylesheets required by each module will be concatenated into a single release file.
- Assets referred to on the included stylesheets are copied to a release location. All reative URLs on the release stylesheet will remain valid.
- On debug builds, no concatenation is performed but, instead, code is generated to make the browser read the original source files, in the correct loading order.

**Note:** this plugin **does not** minify the resulting files. That task should performed by other Grunt plugins that can be chained on the build pipeline.

### Status

The javascript source analyser / builder is implemented, although further testing may be needed.

I'm currently working on the CSS builder. I expect it to be available very soon.

### Documentation

The documentation is being written.
Please come back later.

### Support / Contributing

I recommend you to wait until a stable version is released.

### Release History
See the [CHANGELOG](CHANGELOG).
