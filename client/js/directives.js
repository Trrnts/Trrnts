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
      var map = new Datamap({'element': element[0]});
    },
  };
});
