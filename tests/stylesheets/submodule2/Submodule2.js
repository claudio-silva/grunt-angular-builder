//# stylesheet ("styles.css")

//#stylesheet ( 'styles2.css' )

(function () {

  var myPrivateVar = 1;

  angular.module ('Submodule2', []).

    directive ('test', function () {
    return {
      restrict: 'E',
      link: function (scope, element, attrs) {
        return myPrivateFn ();
      }
    };
  });

  function myPrivateFn () {
    return myPrivateVar;
  }

}) ();
