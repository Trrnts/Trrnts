angular.module('trrntsApp', [
  'trrntsApp.controllers',
  'trrntsApp.services',
  'trrntsApp.directives',
  'trrntsApp.filters'
])
.config(['$compileProvider', function ($compileProvider) {
  // Angular prefixes magnet URIs with "unsafe:", which makes them unclickable.
  // Uncomment this line if you prefer clickable magnet links.
  // $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|magnet):/);
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
}]);

angular.module('trrntsApp.directives', [])

.directive('barChart', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      element = element[0];
      var barWidth = attrs.barWidth || 20;
      var barSpace = attrs.barSpace || 1;
      var chartHeight = element.offsetHeight;
      var highlightHeightDiff = attrs.highlightHeightDiff || 20;

      // Dummy data fallback for now...
      var data = scope.data || [12, 16, 17, 7, 24, 8, 5, 19, 8, 12, 12, 43];

      var y = d3.scale.linear()
                .domain([0, d3.max(data)])
                .range([0, chartHeight - highlightHeightDiff]);

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
          .attr('y', function (d, i) { return chartHeight-y(d); })
          .attr('height', function (d) { return y(d); });

      bar.on('mouseover', function (d, i) {
        var currentBar = bar.filter(function (d, k) {
          return k === i;
        })
        .transition()
        .attr('y', function (d, i) { return chartHeight - y(d) - highlightHeightDiff; })
        .attr('height', function (d) { return y(d) + highlightHeightDiff; });
      });

      bar.on('mouseleave', function (d, i) {
        var currentBar = bar.filter(function (d, k) {
          return k === i;
        })
        .transition()
        .attr('y', function (d, i) { return chartHeight - y(d); })
        .attr('height', function (d) { return y(d); });
        // console.log(currentBar);
      });

    }
  };
});

angular.module('trrntsApp.filters', [])

.filter('agoFilter', function () {
  return function (timestamp) {
    timestamp = parseInt(timestamp);
    return moment(timestamp).fromNow() + ' ago';
  };
});

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
