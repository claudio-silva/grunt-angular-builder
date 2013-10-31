/**
 * App init.
 */
$ (document).ready (function ()
{
  // Prevent errors from debug console calls accidentally left on the code
  // on browsers which do not support it.
  if (!('console' in window))
    window.console = {debug: $.noop, log: $.noop, error: $.noop, info: $.noop, warn: $.noop};

  // Start Angular.
  angular.bootstrap (document.body, ['App']);

});