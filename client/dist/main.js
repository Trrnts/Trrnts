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
      .then(function () {
        $scope.error = null;
        $scope.success = 'Yeah! Success!';
        $scope.magnetURI = null;
      })
      .catch(function (response) {
        $scope.success = null;
        $scope.error = response.data.error;
      });
    }
  };
}])

.controller('LatestMagnetLinksController', ['$scope', 'MagnetLinksFactory', 'SharedService', function ($scope, MagnetLinksFactory, SharedService) {
  $scope.perPage = 10;
  $scope.start = 0;
  $scope.stop = $scope.start + $scope.perPage - 1;
  $scope.busy = false;

  $scope.latest = [];

  $scope.openModal = function(selectedMagnet){
    SharedService.prepForBroadcast(selectedMagnet);
  };

  $scope.loadMore = function () {
    if ($scope.busy) {
      return;
    }
    $scope.busy = true;
    MagnetLinksFactory.latest($scope.start, $scope.stop).then(function (results) {
      $scope.latest = $scope.latest.concat(results.data);
      $scope.start += $scope.perPage;
      $scope.stop += $scope.perPage;
      $scope.busy = false;
    });
  };
}])

.controller('TopMagnetLinksController', ['$scope', 'MagnetLinksFactory', 'SharedService', function ($scope, MagnetLinksFactory, SharedService) {
  $scope.perPage = 10;
  $scope.start = 0;
  $scope.stop = $scope.start + $scope.perPage - 1;
  $scope.busy = false;

  $scope.top = [];

  $scope.openModal = function(selectedMagnet){
    SharedService.prepForBroadcast(selectedMagnet);
  };

  $scope.loadMore = function () {
    if ($scope.busy) {
      return;
    }
    $scope.busy = true;
    MagnetLinksFactory.top($scope.start, $scope.stop).then(function (results) {
      $scope.top = $scope.top.concat(results.data);
      $scope.start += $scope.perPage;
      $scope.stop += $scope.perPage;
      $scope.busy = false;
    });
  };
}])

.controller('SearchBoxController', ['$scope', '$state', function ($scope, $state) {
  $scope.search = function () {
    $state.go('trrntsApp.main.search', {
      query: $scope.query
    });
  };
}])

.controller('SearchResultsController', ['$scope', '$stateParams', 'MagnetLinksFactory', 'SharedService', function ($scope, $stateParams, MagnetLinksFactory, SharedService) {
  $scope.results = [];
  $scope.query = $stateParams.query;

  $scope.openModal = function(selectedMagnet){
    SharedService.prepForBroadcast(selectedMagnet);
  };

  MagnetLinksFactory.search($scope.query).then(function (results) {
    $scope.results = results.data;
  });
}])

//
// .controller('SearchMagnetLinksController', ['$scope', 'MagnetLinksFactory', '$state', function ($scope, MagnetLinksFactory, $state) {
//   // $scope.submit = function () {
//   //   MagnetLinksFactory.search($scope.search).then(function (result) {
//   //     $scope.searchResults = result.data;
//   //     console.log($scope.searchResults.length, "length");
//   //     reset();
//   //     update();
//   //   }).catch(function () {
//   //     $scope.showResults = [];
//   //   });
//   //   $scope.hasBeenSubmitted = true;
//   // };
//
//
//   $scope.search = function () {
//     console.log($scope.query);
//     $state.go('trrntsApp.main.search', {
//       query: $scope.query
//     });
//     // $state.href('/search', {
//     //   query: $scope.query
//     // });
//   };
// }])

.controller('WorldMapController', ['$scope', 'GeoFactory', function ($scope, GeoFactory) {
  $scope.latAndLong = {};
  $scope.countries = {};
  $scope.cities = {};
  $scope.numberOfCountries = 15;
  $scope.numberOfLatAndLongs = 100;
  $scope.numberOfCities = 10;

  // Used to display data after it is received
  $scope.gotLL = false;
  $scope.gotCountries = false;
  $scope.gotCities = false;

  $scope.getLatAndLong = function (amount) {
    GeoFactory.getLatAndLong(amount).then(function (results) {
      $scope.latAndLong = results.data;
      $scope.gotLL = true;
    }).catch(function (err) {
      console.log(err);
    });
  };

  $scope.getCountries = function (amount) {
    GeoFactory.getCountries(amount).then(function (results) {
      $scope.countries = results.data;
      $scope.gotCountries = true;
    }).catch(function (err) {
      console.log(err);
    });
  };

  $scope.getCities = function (amount) {
    GeoFactory.getCities(amount).then(function (results) {
      $scope.cities = results.data;
      $scope.gotCities = true;
    }).catch(function (err) {
      console.log(err);
    });
  };
  // Get Location Data
  $scope.getLatAndLong($scope.numberOfLatAndLongs);
  $scope.getCountries($scope.numberOfCountries);
  $scope.getCities($scope.numberOfCities);

}])
.controller('ModalViewController', ['$scope', 'SharedService', '$location', '$state', function($scope, SharedService, $location, $state) {
  $scope.modalShown = true;
  console.log('Here');
  $scope.selectedMagnet = SharedService.selectedMagnet;
  // $scope.$on('handleBroadcast', function() {
  //   $scope.selectedMagnet = SharedService.selectedMagnet;
  //   // $state.go('.'+$scope.selectedMagnet.name.replace(' ', '_'));
  //   // $location.path('top/'+$scope.selectedMagnet.name.replace(' ', '_'));
  //   $scope.modalShown = !$scope.modalShown;
  // });

}]);

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

      var generateStats = function (lls) {
        var formatedLLs = [];
        var highestValue = 0;

        // get Highest Value
        for (var ll in lls) {
          if (parseInt(lls[ll]) > highestValue) {
            highestValue = parseInt(lls[ll]);
          }
        }

        for (ll in lls) {
          var bubble = {
            fillKey : 'torrents',
            radius :  maintainRatio(50, highestValue, lls[ll]), // Control Size by Max
            torrentsTotal: lls[ll]
          };

          var latAndLong = ll.split(',');
          bubble.latitude = latAndLong[0];
          bubble.longitude = latAndLong[1];
          if (latAndLong.length > 1 && latAndLong[0] !== '?') {
            formatedLLs.push(bubble);
          }
        }

        return formatedLLs;
      };

      var maintainRatio = function (max, highestValue, value) {
        return Math.floor((value/highestValue) * max);
      };

      var map = new Datamap({
        'element': element[0],
        fills: {
          defaultFill: '#ccc',
          torrents: '#222'
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

.directive('modalDialog',['$state', function($state) {
  return {
    restrict: 'E',
    scope: {
      show: '='
    },
    replace: true, // Replace with the template below
    transclude: true, // we want to insert custom content inside the directive
    link: function(scope, element, attrs) {
      scope.dialogStyle = {};
      if (attrs.width)
        scope.dialogStyle.width = attrs.width;
      if (attrs.height)
        scope.dialogStyle.height = attrs.height;
      scope.hideModal = function() {
        $state.go('^');
        scope.show = false;
      };
    },
    template: "<div class='ng-modal' ng-show='show'><div class='ng-modal-overlay' ng-click='hideModal()'></div><div class='ng-modal-dialog' ng-style='dialogStyle'><div class='ng-modal-close' ng-click='hideModal()'>X</div><div class='ng-modal-dialog-content' ng-transclude></div></div></div>"
  };
}])

.directive('donutChart', function () {
  return {

    restrict : 'A',
    link : function (scope, element, attrs) {
      element = element[0];
      var data = [];
      console.log(scope.countries, attrs.donutType);
      var dataset = scope[attrs.donutType] || [10,20,30,40,50];
      if (!Array.isArray(dataset) && typeof(dataset) === 'object') {
        for (var key in dataset) {
          if (key !== '?') {
            data.push({
              'label' : key,
              'value' : dataset[key]
            });
          }
        }
      } else {
        data = dataset;
      }

      var radius = attrs.donutRadius || 200,
          width = radius * 2,
          height = radius * 2;
          outerRadius = width / 2;
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
                                           innerRadius + ')');

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
    }
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
  $urlRouterProvider.otherwise('');

  $stateProvider
    .state('trrntsApp.main', {
      url: '',
      views: {
        '': {
          // We need this line in order to set the default child view that
          // will be inserted into <div ui-view></div> inside the main template
          templateUrl: 'views/main.tpl.html',
          // We need this line in order to set the default child view that
          // will be inserted into <div ui-view></div> inside the main template
          controller: ['$state', function ($state) {
            if ($state.current.url === '') {
              $state.go('trrntsApp.main.top');
            }
          }]
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
    url: '/top',
    templateUrl: 'views/topMagnets.tpl.html',
    controller: 'TopMagnetLinksController'
  })
  .state('trrntsApp.main.latest', {
    url: '/latest',
    templateUrl: 'views/latestMagnets.tpl.html',
    controller: 'TopMagnetLinksController'
  })
  .state('trrntsApp.main.stats', {
    url: '/stats',
    templateUrl: 'views/worldMap.tpl.html',
    controller: 'WorldMapController'
  })
  .state('trrntsApp.main.submit', {
    url: '/submit',
    templateUrl: 'views/submitMagnet.tpl.html',
    controller: 'SubmitMagnetLinkController'
  })
  .state('trrntsApp.main.about', {
    url: '/about',
    templateUrl: 'views/about.tpl.html'
  })
  .state('trrntsApp.main.search', {
    url: '/search?query',
    templateUrl: 'views/searchMagnets.tpl.html',
    controller: 'SearchResultsController'
  })

  .state('trrntsApp.main.top.detail', {
    url: '/detail',
    templateUrl: 'views/detail.tpl.html',
    controller: 'ModalViewController'
  })
  .state('trrntsApp.main.latest.detail', {
    url: '/detail/:magnetName',
    templateUrl: 'views/detail.tpl.html',
    controller: 'ModalViewController'
  })
  .state('trrntsApp.main.stats.detail', {
    url: '/detail/:magnetName',
    templateUrl: 'views/detail.tpl.html',
    controller: 'ModalViewController'
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
  var search = function (query) {
    if (typeof(query) !== 'string') {
      return $q.defer().promise;
    }

    return $http({
      method: 'GET',
      url:'api/magnets',
      params: {
        query: query
      }
    });
  };

  return {
    create: create,
    latest: latest,
    top: top,
    search:search
  };
}])
.factory('SharedService', ['$rootScope', function($rootScope) {
    var sharedService = {};

    sharedService.selectedMagnet = 'default';

    sharedService.prepForBroadcast = function(newMagnet) {
        this.selectedMagnet = newMagnet;
        this.broadcastItem();
    };

    sharedService.broadcastItem = function() {
        $rootScope.$broadcast('handleBroadcast');
    };

    return sharedService;
}])
.factory('GeoFactory', ['$http', function ($http) {
  // Return specified number of Lat&Long with the total number of peers for respective Lat&Long
  var getLL = function (numberOfLls) {
    return $http({
      method:'GET',
      url:'api/locations',
      params: {
        query: 'LatAndLong',
        number: numberOfLls
      }
    });
  };

  // Return specified number of countries with the total number of peers for respective countries
  var getCountry = function (amount) {
    return $http({
      method:'GET',
      url:'api/locations',
      params: {
        query: 'Country',
        number: amount
      }
    });
  };

  // Return specified number of cities with the total number of peers for respective cities
  var getCity = function (amount) {
    return $http({
      method:'GET',
      url:'api/locations',
      params: {
        query: 'City',
        number: amount
      }
    });
  };


  return {
    getLatAndLong : getLL,
    getCountries : getCountry,
    getCities : getCity,
  };
}]);
