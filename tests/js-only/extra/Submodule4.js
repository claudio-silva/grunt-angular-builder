(function (declare)
{
  angular.module ('Submodule4').service ('testA', function ()
  {
    // code ommited
  });

  declare.service ('testB', function ()
  {
    // code ommited
  });
}) (angular.module ('Submodule4', []));