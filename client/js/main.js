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
      url: '',
      views:{
        '': {
          templateUrl: 'views/main.tpl.html',
          controller: ['$scope', '$state', function( $scope, $state) {
               $state.go('trrntsApp.main.top');
          }],
        },

        'searchMagnets@trrntsApp.main': {
          templateUrl: 'views/searchMagnets.tpl.html',
          controller: 'SearchMagnetLinksController'
        },

        'submitMagnet@trrntsApp.main': {
          templateUrl: 'views/submitMagnet.tpl.html',
          controller: 'SubmitMagnetLinkController'
        }
      }
    })
  .state('trrntsApp.main.top', {
    url:'/top',
    templateUrl: 'views/topMagnets.tpl.html',
    controller: 'TopMagnetLinksController'
  })
  .state('trrntsApp.main.latest', {
    url:'/latest',
    templateUrl: 'views/latestMagnets.tpl.html',
    controller: 'TopMagnetLinksController'
  })
  .state('trrntsApp.main.map', {
    url:'/map',
    templateUrl: 'views/worldMap.tpl.html',
    controller: 'WorldMapController'
  });
}]);
