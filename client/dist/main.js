angular.module('trrntsApp', [
  'trrntsApp.controllers',
  'trrntsApp.services',
  'trrntsApp.directives'
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
}]);

angular.module('trrntsApp.directives', [])

.directive('barChart', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      element = element[0];
      var barWidth = attrs.barWidth || 20;
      var barSpace = attrs.barSpace || 2;
      var chartHeight = element.offsetHeight;

      // Dummy data fallback for now...
      var data = scope.data || [12, 23, 23, 234, 324, 243, 3, 23];

      var y = d3.scale.linear()
                .domain([0, d3.max(data)])
                .range([0, chartHeight]);

      d3.select(element)
        .selectAll('rect')
          .data(data)
        .enter().append('rect')
          .attr('class', 'bar')
          .attr('width', barWidth)
          .attr('x', function (d, i) { return barWidth*i + barSpace*i; })
          .attr('y', chartHeight)
          .attr('height', 0)
          .transition()
          .delay(function (d, i) { return i*100; })
          .attr('y', function (d, i) { return chartHeight-y(d); })
          .attr('height', function (d) { return y(d); });
    }
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
