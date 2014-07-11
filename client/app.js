var app = angular.module('Trrnts', []);
angular.module('trrnts', ['trrnts.magnetLink', 'trrnts.services', 'ui.router'])

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: 'magnetlink/magnetLink.html'
    })
});