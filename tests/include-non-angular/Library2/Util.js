//------------------------------------------------------------------------------------
// Util.js
//------------------------------------------------------------------------------------

//# script ("../other/other3.js")

/**
 * Miscellaneous utility functions.
 * @constructor
 */
function UtilService ($q)
{
  /**
   * Transforms a text by suppressing redundant white space, capitalizing the first word and lowering
   * the case of all other characters.
   * @param {string} name
   * @returns {string}
   */
  this.normalizeName = function (name)
  {
    return (name[0].toUpperCase () + name.substr (1).toLowerCase ()).replace (/^\s+|\s+$/g,
      '').replace (/\s{2,}/g, ' ')
  };

}
