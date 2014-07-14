angular.module('trrntsApp', [
  'trrntsApp.controllers',
  'trrntsApp.services',
  'trrntsApp.directives'
])
.config(['$compileProvider', function ($compileProvider) {
  // Angular prefixes magnet URIs with "unsafe:", which makes them unclickable.
  // Uncomment this line if you prefer clickable magnet links.
  // $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|magnet):/);
}]);
