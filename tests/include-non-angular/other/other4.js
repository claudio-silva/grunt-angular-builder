//------------------------------------------------------------------------------------
// other4.js
//------------------------------------------------------------------------------------

//# require ("other5.js")

/**
 * Returns the selected environment name.
 * @returns {string}
 */
function getEnv ()
{
  var env = program.env || process.env.ENV_NAME || 'development';
  switch (env) {
    case 'development':
    case 'IW':
    case 'staging':
      break;
    case 'production':
      env = '';
      break;
    default:
      console.error ("Invalid environment: " + env);
      process.exit (1);
  }
  return env;
}
