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
  $scope.perPage = 10;
  $scope.start = 0;
  $scope.stop = $scope.start + $scope.perPage - 1;

  $scope.latest = [];

  $scope.loadMore = function () {
    MagnetLinksFactory.latest($scope.start, $scope.stop).then(function (results) {
      $scope.latest = $scope.latest.concat(results.data);
      $scope.start += $scope.perPage;
      $scope.stop += $scope.perPage;
    });
  };
}])

.controller('TopMagnetLinksController', ['$scope', 'MagnetLinksFactory', 'SharedService', function ($scope, MagnetLinksFactory, SharedService) {
  $scope.perPage = 10;
  $scope.start = 0;
  $scope.stop = $scope.start + $scope.perPage - 1;

  $scope.top = [];

  $scope.openModal = function(selectedMagnet){
    SharedService.prepForBroadcast(selectedMagnet);
  };

  $scope.loadMore = function () {
    MagnetLinksFactory.top($scope.start, $scope.stop).then(function (results) {
      $scope.top = $scope.top.concat(results.data);
      $scope.start += $scope.perPage;
      $scope.stop += $scope.perPage;
    });
  };
}])

.controller('SearchMagnetLinksController', ['$scope', 'MagnetLinksFactory',  function ($scope, MagnetLinksFactory) {
  $scope.search = '';
  $scope.searchResults = [];
  $scope.showResults = [];
  $scope.perPage = 10;
  $scope.start = 0;
  $scope.hasBeenSubmitted = false;

  var reset = function () {
      $scope.start = 0;
  };

  $scope.hasPrev = function () {
    return $scope.start > 1;
  };

  $scope.hasNext = function () {
    return $scope.searchResults.length > $scope.start + $scope.perPage;
  };

  var update = function () {
    var toShow = 0;
    $scope.showResults = [];
    if ($scope.hasNext()) {
      toShow = $scope.perPage;
    } else {
      toShow = $scope.searchResults.length - $scope.start;
    }

    for (var i = 0 ; i < toShow; i++) {
      $scope.showResults[i] = $scope.searchResults[$scope.start + i];
    }
  };

  $scope.next = function () {
    $scope.start += $scope.perPage;
    update();
  };

  $scope.prev = function () {
    $scope.start -= $scope.perPage;
    update();
  };

  $scope.submit = function () {
    MagnetLinksFactory.search($scope.search).then(function (result) {
      $scope.searchResults = result.data;
      console.log($scope.searchResults.length, "length");
      reset();
      update();
    }).catch(function () {
      $scope.showResults = [];
    });
    $scope.hasBeenSubmitted = true;
  };
}])

.controller('WorldMapController', ['$scope', function ($scope) {

}])

.controller('ModalViewController', ['$scope', 'SharedService', function($scope, SharedService) {
  $scope.modalShown = false;
  $scope.toggleModal = function() {

  };

  $scope.$on('handleBroadcast', function() {
    $scope.selectedMagnet = SharedService.selectedMagnet;
    $scope.modalShown = !$scope.modalShown;
  });
}]);
