angular.module('trrntsApp.directives', [])

.directive('counter', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var max = parseInt(attrs.max);
      var current = 0;
      element = element[0];
      current = -2;
      if (max > 100) {
        current = max - 100;
      }
      var animate = function () {
        updateColor();
        current += 1;
        element.textContent = current;
        if (current < max) {
          setTimeout(animate, 1);
        }
      };
      var updateColor = function () {
        var optacity = current/1000;
        if (optacity < 0.2) {
          optacity = 0.2;
        }
        if (optacity > 1) {
          optacity = 0.6;
        }
        element.style.color = 'rgba(0, 0, 0, ' + optacity + ')';
      };
      animate();
    }
  };
})

.directive('barChart', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      if (scope.selectedMagnet === undefined) {
        return;
      }

      element = element[0];
      var barWidth = attrs.barWidth || 20;
      var barSpace = attrs.barSpace || 1;

      // Chart height needs to be specified using attribute AND CSS. Otherwise
      // Fx will throw crazy errors. Don't try to do something like
      // element.outerHeight. It won't work.
      var chartHeight = attrs.barChartHeight || 70;
      var chartWidth = $(element).width();
      var highlightHeightDiff = attrs.highlightHeightDiff || 20;

      var data = scope.selectedMagnet.peers || {};
      var chart = d3.select(element);

      var maxBars = Math.floor(chartWidth/(barWidth + barSpace));

      var formattedData = [];
      for (var i = 0; i < data.length; i += 2) {
        formattedData.unshift({
          peers: parseInt(data[i]),
          t: parseInt(data[i+1])
        });
      }

      data = formattedData.reverse();
      data = data.slice(0, maxBars);
      data = data.reverse();

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

      /* generate stats by creating an array of objects which are used to
         generate bubbles on the map. Each Element:
         obj = {
            fillKey: colorPalette, // defautl color palette set for bubbles in maps is torrents
            radius : number, // Size of Bubble
            torrentsTotal: number, // Number of Torrents at this location. Used for Displaying in Tool Tip
            latitude: number,
            longitude: number
          }
      */
      var generateStats = function (lls) {
        var formatedLLs = [];
        var highestValue = 0;

        // get highest number of torrents for the set of Longitute & Latitude
        for (var ll in lls) {
          if (parseInt(lls[ll]) > highestValue) {
            highestValue = parseInt(lls[ll]); //parseInt, because value is string
          }
        }

        for (ll in lls) {
          var bubble = {
            fillKey : 'torrents',
            radius :  maintainRatio(50, highestValue, lls[ll]), // max size of Bubbles currently 50
            torrentsTotal: lls[ll]
          };

          var latAndLong = ll.split(',');
          bubble.latitude = latAndLong[0];
          bubble.longitude = latAndLong[1];

          // Check to ensure if not undefined Lat & Long
          if (latAndLong.length > 1 && latAndLong[0] !== '?' && latAndLong[1] !== '?') {
            formatedLLs.push(bubble);
          }
        }

        return formatedLLs;
      };

      // Limit Max Size of Bubbles & Maintain value ratio for the data set
      var maintainRatio = function (max, highestValue, value) {
        return Math.floor((value/highestValue) * max);
      };

      var map = new Datamap({
        'element': element[0],
        fills: {
          defaultFill: '#ccc', // Default Color of Each Country
          torrents: '#222' // Defaut Color of Each Bubble
        }
      });

      // Generate Stats
      var llStats = generateStats(scope.latAndLong);
      map.bubbles(llStats, {
        popupTemplate: function (geo, data) {
          return '<div class="hoverinfo"> Total Number of Torrents: <strong>' +
                                        data.torrentsTotal + '</strong></div>';
        }
      });
    },
  };
})

.directive('modalDialog',['$state', '$timeout', function($state, $timeout) {
  return {
    restrict: 'E',
    scope: {
      show: '='
    },
    replace: true, // Replace with the template below
    transclude: true, // we want to insert custom content inside the directive
    link: function(scope, element, attrs) {
      scope.animation = 'ng-modal-dialog-slide-in';
      scope.dialogStyle = {};
      if (attrs.width)
        scope.dialogStyle.width = attrs.width;
      if (attrs.height)
        scope.dialogStyle.height = attrs.height;
      scope.hideModal = function() {
        scope.animation = 'ng-modal-dialog-slide-out';
        // Need Timeout, to Allow animation to finish'
        $state.go('^');
        $timeout(function () {
          scope.show = false;
        }, 1003);
      };
    },
    template: "<div class='ng-modal' ng-show='show'><div class='ng-modal-overlay' ng-click='hideModal()'></div><div class='ng-modal-dialog' ng-style='dialogStyle'><!--div class='ng-modal-close' ng-click='hideModal()'>X</div--><div class='ng-modal-dialog-content' ng-transclude></div></div></div>"
  };
}])

.directive('donutChart', function () {
  return {
    restrict : 'A',
    link : function (scope, element, attrs) {
      element = element[0];
      var data = []; // store formatted dataset for use in d3
      var dataset = scope[attrs.donutType]; // store data received from server passed through scope

      if (typeof(dataset) === 'object') {
        for (var key in dataset) {
          // Check to ensure not using undefined locations
          if (key !== '?') {
            data.push({
              'label' : key,
              'value' : dataset[key]
            });
          }
        }
      }

      // Initializes a new tooltip.
      var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-20-10, 0])
        .html(function(d) {
          return '<div>Total Number of Torrents: <strong> ' + d.value + '</strong></div>';
        });

      // Define properties of Donut Chart - tweak outerRadius & innerRadius for thickness
      // of donut
      var radius = attrs.donutRadius || 200,
          width = radius * 2,
          height = radius * 2,
          outerRadius = width / 2,
          innerRadius = width / 3;

      var pie = d3.layout.pie()
                  .sort(null)
                  .value(function (d) {
                    return d.value || d;
                  });

      var arc = d3.svg.arc()
                  .outerRadius(outerRadius)
                  .innerRadius(innerRadius);

      var svg = d3.select(element)
                  .attr('width', width)
                  .attr('height', height)
                  .append('g')
                  .attr('transform', 'translate(' + 0 + ',' +
                                                height / 6 + ')');

      var color = d3.scale.category20();

      var arcs = svg.selectAll('g.arc')
         .data(pie(data))
         .enter()
         .append('g')
         .attr('class', 'arc')
         .attr('transform', 'translate(' + outerRadius + ',' +
                                           innerRadius + ')').call(tip);

      arcs.append('path')
          .attr('fill', function(d, i) {
            return color(i);
          })
          .attr('d', arc);

      arcs.append('text')
          .attr('transform', function (d) {
            return 'translate(' + arc.centroid(d) + ')';
          })
          .attr('text-anchor', 'middle')
          .text(function (d) {
            return d.data.label;
          });

      arcs.on('mouseover', tip.show);
      arcs.on('mouseleave', tip.hide);
    }
  };
});
