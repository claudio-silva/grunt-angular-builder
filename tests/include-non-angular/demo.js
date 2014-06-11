//------------------------------------------------------------------------------------
// demo.js
//------------------------------------------------------------------------------------

// Require an already-required script.
//# require ("startup.js")

/**
 * Compares two objects and returns information about which properties are different.
 * Inherited properties are not considered.
 * @param {Object|null} obj1
 * @param {Object|null} obj2
 * @return {Object} A map of property names to values of those properties on obj2.
 */
function diff (obj1, obj2)
{
  obj1 = obj1 || {};
  obj2 = obj2 || {};
  var diff = {};
  for (var key in obj1)
    if (obj1.hasOwnProperty (key))
      if (!obj2.hasOwnProperty (key) || obj2[key] !== obj1[key])
        diff[key] = obj2[key];
  for (var key in obj2)
    if (obj2.hasOwnProperty (key) && !obj1.hasOwnProperty (key))
      diff[key] = obj2[key];
  return diff;
}