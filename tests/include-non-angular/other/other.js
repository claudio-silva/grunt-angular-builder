//------------------------------------------------------------------------------------
// other.js
//------------------------------------------------------------------------------------

/**
 * Copies inherited properties of an object into itself.
 * @param {Object|Array} obj If an array is specified, each element in the array will be flattened.
 * @returns {Object} The input object.
 */
function flatten (obj)
{
  if (obj instanceof Array)
    _.forEach (all, function (o) { _.forIn (o, function (v, k) { o[k] = v }) });
  else _.forIn (obj, function (v, k) { obj[k] = v });
  return obj;
}