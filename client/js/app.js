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
