'use strict';

/**
 * A plugin that generates a list of stylesheets required by the included modules.
 * @constructor
 * @implements {PluginInterface}
 */
function StylesheetsPlugin () {
  this.stylesheets = [];
}

StylesheetsPlugin.prototype = {

  /**
   * @inheritDoc
   * @param {ModuleDef} module
   */
  trace: function (module)
  {
    module= this.porra;
  },

  /**
   * @inheritDoc
   * @param {ModuleDef} module
   */
  build: function (module)
  {
    module = module;

  }
};

module.exports.newInstance = function ()
{
  return new StylesheetsPlugin ();
};