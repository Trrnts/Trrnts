angular.module('trrnts.magnetLink', [])


.controller('magnetLink', function ($scope, mangetLink) {
  $scope.form = {'magnetLink': ''};

  // submit magnetLink
  $scope.submit = function () {
    // base check: value not null
    
    if ($scope.form.magnetLink) {
      magnetLink.submit($scope.form.magnetLink);
    }
  }
});