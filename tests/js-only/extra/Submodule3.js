(function (module)
{
  module.service ('testX', function ()
  {
    // code ommited
  });

  angular.module ('Submodule3').service ('testX2', function ()
  {
    // code ommited
  });
}) (angular.module ('Submodule3', []));