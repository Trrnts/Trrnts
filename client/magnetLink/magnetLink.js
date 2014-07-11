angular.module('trrnts.magnetLink', [])


.controller('magnetLink', function ($scope, mangetLink) {
  $scope.form = {'magnetLink': ''};

  $scope.submit = function () {
    // base check: value not null    
    if ($scope.form.magnetLink) {
      magnetLink.submit($scope.form.magnetLink)
      .catch(function (err) {
        console.error(err);
      };
    }
  };
});