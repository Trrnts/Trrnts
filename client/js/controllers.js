angular.module('trrntsApp.controllers', [])

.controller('SubmitMagnetLinkController', ['$scope', 'MagnetLinksFactory', function ($scope, MagnetLinksFactory) {
  $scope.magnetURI = '';

  $scope.submit = function () {
    // base check: value not null
    if ($scope.magnetURI) {
      MagnetLinksFactory.submit($scope.magnetURI)
      .catch(function (err) {
        console.error(err);
      });
    }
  };
}])

.controller('LatestMagnetLinksController', ['$scope', 'MagnetLinksFactory', function ($scope, MagnetLinksFactory) {
  $scope.latestMagnets = [];

  // We issue a GET request via the factory, then we update the scope
  MagnetLinksFactory.getLatest(10).then(function (result) {
    $scope.latestMagnets = result.data;
  }).catch(function(){
    $scope.latestMagnets = ['There has been an error houston'];
  });
}])

.controller('TopMagnetLinksController', ['$scope', function ($scope) {
  $scope.topMagnets = [];
}]);
