angular.module('trrntsApp.controllers', [])

.controller('SubmitMagnetLinkController', ['$scope', 'MagnetLinksFactory', function ($scope, MagnetLinksFactory) {
  $scope.magnetURI = '';

  $scope.submit = function () {
    // base check: value not null
    if ($scope.magnetURI) {
      MagnetLinksFactory.create($scope.magnetURI)
      .then(function () {
        $scope.error = null;
        $scope.success = 'Yeah! Success!';
        $scope.magnetURI = null;
      })
      .catch(function (response) {
        $scope.success = null;
        $scope.error = response.data.error;
      });
    }
  };
}])

.controller('LatestMagnetLinksController', ['$scope', 'MagnetLinksFactory', 'SharedService', function ($scope, MagnetLinksFactory, SharedService) {
  $scope.perPage = 10;
  $scope.start = 0;
  $scope.stop = $scope.start + $scope.perPage - 1;
  $scope.busy = false;

  $scope.latest = [];

  $scope.openModal = function(selectedMagnet){
    SharedService.prepForBroadcast(selectedMagnet);
  };

  $scope.loadMore = function () {
    if ($scope.busy) {
      return;
    }
    $scope.busy = true;
    MagnetLinksFactory.latest($scope.start, $scope.stop).then(function (results) {
      $scope.latest = $scope.latest.concat(results.data);
      $scope.start += $scope.perPage;
      $scope.stop += $scope.perPage;
      $scope.busy = false;
    });
  };
}])

.controller('TopMagnetLinksController', ['$scope', 'MagnetLinksFactory', 'SharedService', function ($scope, MagnetLinksFactory, SharedService) {
  $scope.perPage = 10;
  $scope.start = 0;
  $scope.stop = $scope.start + $scope.perPage - 1;
  $scope.busy = false;

  $scope.top = [];

  $scope.openModal = function(selectedMagnet){
    SharedService.prepForBroadcast(selectedMagnet);
  };

  $scope.loadMore = function () {
    if ($scope.busy) {
      return;
    }
    $scope.busy = true;
    MagnetLinksFactory.top($scope.start, $scope.stop).then(function (results) {
      $scope.top = $scope.top.concat(results.data);
      $scope.start += $scope.perPage;
      $scope.stop += $scope.perPage;
      $scope.busy = false;
    });
  };
}])

.controller('SearchBoxController', ['$scope', '$state', function ($scope, $state) {
  $scope.search = function () {
    $state.go('trrntsApp.main.search', {
      query: $scope.query
    });
  };
}])

.controller('SearchResultsController', ['$scope', '$stateParams', 'MagnetLinksFactory', 'SharedService', function ($scope, $stateParams, MagnetLinksFactory, SharedService) {
  $scope.results = [];
  $scope.query = $stateParams.query;

  $scope.openModal = function(selectedMagnet){
    SharedService.prepForBroadcast(selectedMagnet);
  };

  MagnetLinksFactory.search($scope.query).then(function (results) {
    $scope.results = results.data;
  });
}])

//
// .controller('SearchMagnetLinksController', ['$scope', 'MagnetLinksFactory', '$state', function ($scope, MagnetLinksFactory, $state) {
//   // $scope.submit = function () {
//   //   MagnetLinksFactory.search($scope.search).then(function (result) {
//   //     $scope.searchResults = result.data;
//   //     console.log($scope.searchResults.length, "length");
//   //     reset();
//   //     update();
//   //   }).catch(function () {
//   //     $scope.showResults = [];
//   //   });
//   //   $scope.hasBeenSubmitted = true;
//   // };
//
//
//   $scope.search = function () {
//     console.log($scope.query);
//     $state.go('trrntsApp.main.search', {
//       query: $scope.query
//     });
//     // $state.href('/search', {
//     //   query: $scope.query
//     // });
//   };
// }])

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

}])
.controller('ModalViewController', ['$scope', 'SharedService', '$location', '$state', function($scope, SharedService, $location, $state) {
  $scope.modalShown = true;
  console.log('Here');
  $scope.selectedMagnet = SharedService.selectedMagnet;
  // $scope.$on('handleBroadcast', function() {
  //   $scope.selectedMagnet = SharedService.selectedMagnet;
  //   // $state.go('.'+$scope.selectedMagnet.name.replace(' ', '_'));
  //   // $location.path('top/'+$scope.selectedMagnet.name.replace(' ', '_'));
  //   $scope.modalShown = !$scope.modalShown;
  // });

}]);
