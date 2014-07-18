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

      console.log(data);

      var formattedData = [];
      for (var i = 0; i < data.length; i += 2) {
        formattedData.push({
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
        .ease('elastic')
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
        .ease('elastic')
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
