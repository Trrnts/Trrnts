angular.module('trrntsApp.controllers', [])

.controller('SubmitMagnetLinkController', function($scope, MagnetLinksFactory) {
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
})

.controller('LatestMagnetLinksController', function ($scope, MagnetLinksFactory) {
  $scope.latestMagnets = [];
  MagnetLinksFactory.getLatestMagnets(10).then(function(result){
    $scope.latestMagnets = result.data;
  }).catch(function(){
    $scope.latestMagnets = ['There has been an error houston'];
  });
})

.controller('TopMagnetLinksController', function ($scope) {
  $scope.topMagnets = [];
});
