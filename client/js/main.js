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
  $urlRouterProvider.otherwise('/top');

  $stateProvider
    .state('trrntsApp.main', {
      url: '',
      views: {
        '': {
          // We need this line in order to set the default child view that
          // will be inserted into <div ui-view></div> inside the main template
          templateUrl: 'views/main.tpl.html',
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
  })
  .state('trrntsApp.main.submit', {
    url:'/submit',
    templateUrl: 'views/submitMagnet.tpl.html',
    controller: 'SubmitMagnetLinkController'
  });
}]);
