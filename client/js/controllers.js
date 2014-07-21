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

  var update = function () {
    MagnetLinksFactory.latest($scope.start, $scope.stop).then(function (result) {
      $scope.latest = result.data;
    }).catch(function () {
      $scope.latest = [];
    });
  };

  update();
}])

.controller('TopMagnetLinksController', ['$scope', 'MagnetLinksFactory', function ($scope, MagnetLinksFactory) {
  $scope.perPage = 10;
  $scope.start = 0;
  $scope.stop = $scope.start + $scope.perPage - 1;
  $scope.top = [];

  var update = function () {
    MagnetLinksFactory.top($scope.start, $scope.stop).then(function (result) {
      $scope.top = result.data;

    }).catch(function () {
      $scope.top = [];
    });
  };

  update();
}])

.controller('SearchMagnetLinksController', ['$scope', 'MagnetLinksFactory', function ($scope, MagnetLinksFactory) {
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

.controller('WorldMapController', ['$scope', 'GeoFactory', function ($scope, GeoFactory) {
  $scope.latAndLong = {};
  $scope.countries = {};
  $scope.cities = {};
  $scope.numberOfCountries = 15;
  $scope.numberOfLatAndLongs = 100;
  $scope.numberOfCities = 10;

  // Used to display data after it is received
  $scope.gotLL = false;
  $scope.gotCountries = false;
  $scope.gotCities = false;

  $scope.getLatAndLong = function (amount) {
    GeoFactory.getLatAndLong(amount).then(function (results) {
      $scope.latAndLong = results.data;
      $scope.gotLL = true;
    }).catch(function (err) {
      console.log(err);
    });
  };

  $scope.getCountries = function (amount) {
    GeoFactory.getCountries(amount).then(function (results) {
      $scope.countries = results.data;
      $scope.gotCountries = true;
    }).catch(function (err) {
      console.log(err);
    });
  };

  $scope.getCities = function (amount) {
    GeoFactory.getCities(amount).then(function (results) {
      $scope.cities = results.data;
      $scope.gotCities = true;
    }).catch(function (err) {
      console.log(err);
    });
  };

  // Get Location Data
  $scope.getLatAndLong($scope.numberOfLatAndLongs);
  $scope.getCountries($scope.numberOfCountries);
  $scope.getCities($scope.numberOfCities);
}]);
