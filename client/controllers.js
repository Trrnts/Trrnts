angular.module('trrntsApp.controllers', [])

.controller('SubmitMagnetLinkController', function($scope, magnetLinksFactory) {
  $scope.magnetURI = '';

  $scope.submit = function () {
    // base check: value not null
    if ($scope.magnetURI) {
      magnetLinksFactory.submit($scope.magnetURI)
      .catch(function (err) {
        console.error(err);
      });
    }
  };
})

.controller('LatestMagnetLinksController', function ($scope) {
  $scope.latestMagnets = [];
})

.controller('TopMagnetLinksController', function ($scope) {
  $scope.topMagnets = [];
});
