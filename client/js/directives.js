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
