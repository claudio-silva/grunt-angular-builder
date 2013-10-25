# A build tool for AngularJS applications

This is a Grunt plugin that generates an optimized build of an AngularJS project.

For release builds, it analyzes and assembles a project's source code into a small set of files; usually one single javascript file and one single CSS file per project (or library), plus any required assets.

For debug builds, it generates a loader script for the original javascript and CSS source files.

### Features

- All required modules are assembled on the correct loading order, unused code is discarded.
- Each angular module can be spread over many source files, over many directories.
    - The build tool assembles each module's source code into a single block, a module definition wrapped in an isolated context.
    - In the process, some code may be transformed to remove redundancies and produce an optimized script.
- CSS stylesheets required by each module will be concatenated into a single release file.
- Assets referred to on the included stylesheets are copied to a release location. All reative URLs on the release stylesheet will remain valid.

- On debug builds, no assemblage is performed but, instead, code is generated to make the browser read the original source files, in the correct loading order. This allows debugging in the browser and faster write-save-refresh cycles.

**Note:** this plugin **does not** minify the resulting files. It preserves the original formatting and comments, so that the resulting files can be distributed as human-friendly source code.  
Minification should be handled by other plugins.

### Status

The javascript source analyser / builder is implemented, although further testing is needed.

**The project is under active development.** More functionality will be available very soon.

### TO DO

- CSS builder.
- Assets builder.
- Documentation.

Please come back later, when the documention is ready.

### Support / Contributing

I recommend you to wait until a stable version is released.

### Release History
See the [CHANGELOG](CHANGELOG).
