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
      url: '/',
      views:{
        '': {
          templateUrl: 'views/main.tpl.html'
        },

        'submitMagnet@trrntsApp.main': {
          templateUrl: 'views/submitMagnet.tpl.html',
          controller: 'SubmitMagnetLinkController'
        },

        'topMagnets@trrntsApp.main': {
          templateUrl: 'views/topMagnets.tpl.html',
          controller: 'TopMagnetLinksController'
        },

        'latestMagnets@trrntsApp.main': {
          templateUrl: 'views/latestMagnets.tpl.html',
          controller: 'LatestMagnetLinksController'
        },

        'worldMap@trrntsApp.main': {
          templateUrl: 'views/worldMap.tpl.html',
          controller: 'WorldMapController'
        }
      }
    });
}]);
