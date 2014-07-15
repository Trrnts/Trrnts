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

      // Dummy data fallback for now...
      for (var i = 0; i < 20; i++) {
        data.push({
          n: Math.random()*100,
          t: new Date().getTime()
        });
      }

      var y = d3.scale.linear()
                .domain([0, d3.max(data, function (d) {
                  return d.n;
                })])
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
          .attr('y', function (d, i) { return chartHeight-y(d.n); })
          .attr('height', function (d) { return y(d.n); });

      bar.on('mouseover', function (d, i) {
        var currentBar = bar.filter(function (d, k) {
          return k === i;
        })
        .transition()
        .attr('y', function () { return chartHeight - y(d.n) - highlightHeightDiff; })
        .attr('height', function () { return y(d.n) + highlightHeightDiff; });
      });

      bar.on('mouseleave', function (d, i) {
        var currentBar = bar.filter(function (d, k) {
          return k === i;
        })
        .transition()
        .attr('y', function (d, i) { return chartHeight - y(d.n); })
        .attr('height', function (d) { return y(d.n); });
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
