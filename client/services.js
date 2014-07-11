angular.module('trrntsApp.services', [])

.factory('magnetLinksFactory', function($http) {
  // Submit Magnet URI
  var submit = function (magnetURI) {
    return $http({
      method: 'POST',
      url: '/api/mangets',
      data: {'magnetURI': magnetURI}
    });
  };

  return {
    'submit': submit
  };
});
