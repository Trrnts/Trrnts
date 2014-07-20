angular.module('trrntsApp', [
  'ui.router',
  'trrntsApp.main'
])
.config(['$stateProvider', function ($stateProvider) {
  // Angular prefixes magnet URIs with "unsafe:", which makes them unclickable.
  // Uncomment this line if you prefer clickable magnet links.
  // $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|magnet):/);
  $stateProvider
    .state('trrntsApp', {
      template: '<ui-view></ui-view>'
    });
}])
.run(['$state', function ($state) {
    // This transitions to 'trrntsApp.main' where we have all the logic for nested views
    $state.transitionTo('trrntsApp.main');
}]);

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

.controller('TopMagnetLinksController', ['$scope', 'MagnetLinksFactory', function ($scope, MagnetLinksFactory) {
  $scope.perPage = 10;
  $scope.start = 0;
  $scope.stop = $scope.start + $scope.perPage - 1;

  $scope.top = [];

  $scope.loadMore = function () {
    MagnetLinksFactory.top($scope.start, $scope.stop).then(function (results) {
      $scope.top = $scope.top.concat(results.data);
      $scope.start += $scope.perPage;
      $scope.stop += $scope.perPage;
    });
  };
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

.controller('WorldMapController', ['$scope', function ($scope) {

}]);

angular.module('trrntsApp.directives', [])

.directive('barChart', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      element = element[0];
      var barWidth = attrs.barWidth || 20;
      var barSpace = attrs.barSpace || 1;

      // Chart height needs to be specified using attribute AND CSS. Otherwise
      // Fx will throw crazy errors. Don't try to do something like
      // element.outerHeight. It won't work.
      var chartHeight = attrs.barChartHeight || 70;
      var highlightHeightDiff = attrs.highlightHeightDiff || 20;

      var data = scope.magnet.peers || {};
      var chart = d3.select(element);

      var formattedData = [];
      for (var i = 0; i < data.length; i += 2) {
        formattedData.unshift({
          peers: parseInt(data[i]),
          t: parseInt(data[i+1])
        });
      }

      data = formattedData;

      var y = d3.scale.linear()
                .domain([0, d3.max(data, function (d) {
                  return d.peers;
                })])
                .range([0, chartHeight - highlightHeightDiff]);

      // Initializes a new tooltip.
      var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-highlightHeightDiff-10, 0])
        .html(function(d) {
          return '<strong>' + d.peers + '</strong> peers <span>' + moment(parseInt(d.t)).fromNow() + '</span>';
        });

      // Adds tooltip to chart.
      chart.call(tip);

      var bar = d3.select(element)
        .selectAll('rect')
          .data(data);

      bar.enter().append('rect')
          .attr('class', 'bar')
          .attr('width', barWidth)
          .attr('x', function (d, i) { return barWidth*i + barSpace*i; })
          .attr('y', chartHeight)
          .attr('height', 0)
          .transition()
          .duration(300)
          .ease('elastic')
          .delay(function (d, i) { return (0.7*i)*30; })
          .attr('y', function (d, i) { return chartHeight-y(d.peers); })
          .attr('height', function (d) { return y(d.peers); });

      bar.on('mouseover', function (d, i) {
        var currentBar = bar.filter(function (d, k) {
          return k === i;
        })
        .transition()
        .ease('bounce')
        .attr('y', function () { return chartHeight - y(d.peers) - highlightHeightDiff; })
        .attr('height', function () { return y(d.peers) + highlightHeightDiff; });

        // Show tooltip.
        tip.show(d);
      });

      bar.on('mouseleave', function (d, i) {
        var currentBar = bar.filter(function (d, k) {
          return k === i;
        })
        .transition()
        .ease('bounce')
        .attr('y', function (d, i) { return chartHeight - y(d.peers); })
        .attr('height', function (d) { return y(d.peers); });

        // Hide tooltip.
        tip.hide(d);
      });
    }
  };
})

.directive('worldMap', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var generateFakePositions = function () {
        var fakePositions = [];
        var fakeLatAndLong = [[49.45045869, -65.15636998],
                        [37.12726948, -17.72583572],
                        [1.16322135, 127.68441455],
                        [-25.38805351, 88.82525081],
                        [-30.31687802, 25.57883445],
                        [-26.46000555, -134.44309036],
                        [-33.52151968, -82.46394689],
                        [-24.96600279, -90.20244849],
                        [-70.94843404, -146.08284954],
                        [-27.03729112, 36.61236272]];

        for (var i = 0; i < fakeLatAndLong.length; i++) {
          var spot = {
            radius: Math.floor(Math.random()*50),
            fillKey: 'torrents'
          };
          spot.latitude = fakeLatAndLong[i][0];
          spot.longitude = fakeLatAndLong[i][1];
          // console.log(fakeLatAndLong[i][0], fakeLatAndLong[i][1]);
          fakePositions.push(spot);
        }

        return fakePositions;
      };

      var map = new Datamap({
        'element': element[0],
        fills: {
          defaultFill: '#ccc',
          torrents: '#222'
        }
      });

      // Generate Fake Stats
      var fakePositions = generateFakePositions();
      // console.log(fakePositions);
      map.bubbles(fakePositions);
    },
  };
});

angular.module('trrntsApp.filters', [])

.filter('agoFilter', function () {
  return function (timestamp) {
    timestamp = parseInt(timestamp);
    return moment(timestamp).fromNow();
  };
});

// main.js contains the logic for nested views
// within the angular.module we require all the local modules we need and within
// the views object when can add and remove subviews with ease

angular.module('trrntsApp.main', [
  'trrntsApp.controllers',
  'trrntsApp.services',
  'trrntsApp.directives',
  'trrntsApp.filters',
  'infinite-scroll'
])
.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

  // This is our default state, here we load the templates and the subviews
  $urlRouterProvider.otherwise('/top');

  $stateProvider
    .state('trrntsApp.main', {
      url: '',
      views:{
        '': {
          // We need this line in order to set the default child view that
          // will be inserted into <div ui-view></div> inside the main template
          templateUrl: 'views/main.tpl.html',
        },
        'searchMagnets@trrntsApp.main': {
          templateUrl: 'views/searchMagnets.tpl.html',
          controller: 'SearchMagnetLinksController'
        }
      }
    })

  // Everything defined as 'trrntsApp.main.STATE_NAME' will
  // become a child from trrntsApp.main
  .state('trrntsApp.main.top', {
    url:'/top',
    templateUrl: 'views/topMagnets.tpl.html',
    controller: 'TopMagnetLinksController'
  })
  .state('trrntsApp.main.latest', {
    url:'/latest',
    templateUrl: 'views/latestMagnets.tpl.html',
    controller: 'TopMagnetLinksController'
  })
  .state('trrntsApp.main.map', {
    url:'/map',
    templateUrl: 'views/worldMap.tpl.html',
    controller: 'WorldMapController'
  })
  .state('trrntsApp.main.submit', {
    url:'/submit',
    templateUrl: 'views/submitMagnet.tpl.html',
    controller: 'SubmitMagnetLinkController'
  });
}]);

angular.module('trrntsApp.services', [])
// need promise library to pass back a blank promise if validation fails
.factory('MagnetLinksFactory', ['$http', '$q', function ($http, $q) {
  // Submit Magnet URI
  var create = function (magnetURI) {
    return $http({
      method: 'POST',
      url: '/api/magnets',
      data: {'magnetURI': magnetURI}
    });
  };

  // Retrieves latest magents.
  var latest = function (start, stop) {
    return $http({
      method: 'GET',
      url:'api/magnets/latest',
      params: {
        start: start || 1,
        stop: stop || 30
      }
    });
  };

  // Retrieves top magents.
  var top = function (start, stop) {
    return $http({
      method: 'GET',
      url:'api/magnets/top',
      params: {
        start: start || 1,
        stop: stop || 30
      }
    });
  };

  // Searches torrents whose titles contains input.
  var search = function (input) {
    if (typeof(input) !== 'string') {
      return $q.defer().promise;
    }

    return $http({
      method: 'GET',
      url:'api/magnets',
      params: {
        query: input
      }
    });
  };

  return {
    create: create,
    latest: latest,
    top: top,
    search:search
  };
}]);
