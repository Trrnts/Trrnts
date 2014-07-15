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

      var data = scope.data || [];
      var chart = d3.select(element);

      // Dummy data fallback for now...
      for (var i = 0; i < 20; i++) {
        data.push({
          peers: Math.floor(Math.random()*100),
          t: new Date().getTime()
        });
      }

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
          return '<strong>' + d.peers + '</strong> peers <span>' + moment(parseInt(d.t)).fromNow() + ' ago</span>';
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
          .delay(function (d, i) { return i*100; })
          .attr('y', function (d, i) { return chartHeight-y(d.peers); })
          .attr('height', function (d) { return y(d.peers); });

      bar.on('mouseover', function (d, i) {
        var currentBar = bar.filter(function (d, k) {
          return k === i;
        })
        .transition()
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
      var map = new Datamap({'element': element[0], fills: {defaultFill:'#ABB2AD', torrents: 'black'}});
      // Generate Fake Stats
      var fakePositions = generateFakePositions();
      console.log(fakePositions);
      map.bubbles(fakePositions);

      function generateFakePositions () {
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
          var spot = {radius: 10, fillKey:'torrents'};
          spot.latitude = fakeLatAndLong[i][0];
          spot.longitude = fakeLatAndLong[i][1];
          console.log(fakeLatAndLong[i][0], fakeLatAndLong[i][1]);
          fakePositions.push(spot);
        }

        return fakePositions;
      }
    },
  };
});

angular.module('trrntsApp.filters', [])

.filter('agoFilter', function () {
  return function (timestamp) {
    timestamp = parseInt(timestamp);
    return moment(timestamp).fromNow() + ' ago';
  };
});

// main.js contains the logic for nested views
// within the angular.module we require all the local modules we need and within
// the views object when can add and remove subviews with ease

angular.module('trrntsApp.main', [
    'trrntsApp.controllers',
    'trrntsApp.services',
    'trrntsApp.directives',
    'trrntsApp.filters'
    ])
  .config(['$stateProvider',function ($stateProvider) {
    $stateProvider
      .state('trrntsApp.main', {
        url: '/',
        views:{
          '': { templateUrl: 'views/main.tpl.html' },

          'submitMagnet@trrntsApp.main': {
                templateUrl: 'views/submitMagnet.tpl.html',
                controller: 'SubmitMagnetLinkController'
          },

          'topMagnets@trrntsApp.main': {
                templateUrl: 'views/topMagnets.tpl.html',
                controller: 'TopMagnetLinksController'
          },
          'latestMagnets@trrntsApp.main': {
                templateUrl: 'views/latestMagnets.tpl.html',
                controller: 'LatestMagnetLinksController'
          },
          'worldMap@trrntsApp.main': {
                templateUrl: 'views/worldMap.tpl.html',
                controller: 'WorldMapController'
          }
        }
      });
}]);

angular.module('trrntsApp.services', [])

.factory('MagnetLinksFactory', ['$http', function ($http) {
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

  return {
    create: create,
    latest: latest,
    top: top
  };
}]);
