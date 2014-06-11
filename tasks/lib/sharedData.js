/*
 * Allows sharing data between extensions.
 */

/**
 * (Re)initializes shared data to default values.
 */
exports.reset = function ()
{
  exports.data = {
    /**
     * Source code to be prepended to the build output file.
     * @type {string}
     */
    prependOutput: ''
  };
};

exports.reset ();