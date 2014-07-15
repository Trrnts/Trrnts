angular.module('trrntsApp.controllers', [])

.controller('SubmitMagnetLinkController', ['$scope', 'MagnetLinksFactory', function ($scope, MagnetLinksFactory) {
  $scope.magnetURI = '';

  $scope.submit = function () {
    // base check: value not null
    if ($scope.magnetURI) {
      MagnetLinksFactory.create($scope.magnetURI)
      .catch(function (err) {
        console.error(err);
      });
    }
  };
}])

.controller('LatestMagnetLinksController', ['$scope', 'MagnetLinksFactory', function ($scope, MagnetLinksFactory) {
  $scope.latest = [];
  MagnetLinksFactory.latest().then(function (result) {
    $scope.latest = result.data;
  }).catch(function () {
    $scope.latest = [];
  });
}])

.controller('TopMagnetLinksController', ['$scope', 'MagnetLinksFactory', function ($scope, MagnetLinksFactory) {
  $scope.top = [];
  MagnetLinksFactory.top().then(function (result) {
    $scope.top = result.data;
  }).catch(function () {
    $scope.top = [];
  });
}])

.controller('WorldMapController', function ($scope) {

});
