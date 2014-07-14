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
