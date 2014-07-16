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
  $scope.start = 1;
  $scope.stop = $scope.start + $scope.perPage - 1;

  $scope.hasPrev = function () {
    return $scope.start > 1;
  };

  $scope.hasNext = function () {
    return true;
  };

  $scope.latest = [];

  var update = function () {
    MagnetLinksFactory.latest($scope.start, $scope.stop).then(function (result) {
      $scope.latest = result.data;
    }).catch(function () {
      $scope.latest = [];
    });
  };

  update();

  $scope.next = function () {
    $scope.start += $scope.perPage;
    $scope.stop += $scope.perPage;
    update();
  };

  $scope.prev = function () {
    $scope.start -= $scope.perPage;
    $scope.stop -= $scope.perPage;
    update();
  };
}])

.controller('TopMagnetLinksController', ['$scope', 'MagnetLinksFactory', function ($scope, MagnetLinksFactory) {
  $scope.perPage = 10;
  $scope.start = 1;
  $scope.stop = $scope.start + $scope.perPage - 1;

  $scope.hasPrev = function () {
    return $scope.start > 1;
  };

  $scope.hasNext = function () {
    return true;
  };

  $scope.top = [];

  var update = function () {
    MagnetLinksFactory.top($scope.start, $scope.stop).then(function (result) {
      $scope.top = result.data;
    }).catch(function () {
      $scope.top = [];
    });
  };

  update();

  $scope.next = function () {
    $scope.start += $scope.perPage;
    $scope.stop += $scope.perPage;
    update();
  };

  $scope.prev = function () {
    $scope.start -= $scope.perPage;
    $scope.stop -= $scope.perPage;
    update();
  };
}])

.controller('SearchMagnetLinksController', ['$scope', 'MagnetLinksFactory', function ($scope, MagnetLinksFactory) {
  $scope.search = '';
  $scope.searchResults = [];
  $scope.hasResults = false;

  $scope.submit = function () {
    $scope.hasResults = false;
    if ($scope.search) {
      MagnetLinksFactory.search($scope.search).then(function (result) {
        $scope.searchResults = result.data;
        $scope.hasResults = true;
      }).catch(function () {
        console.error("Search Failed");
      });
    }
  };
  $scope.submit();
}])

.controller('WorldMapController', ['$scope', function ($scope) {

}]);
