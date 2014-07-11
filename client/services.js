angular.module('trrntsApp.services', [])

.factory('magnetLinksFactory', function($http) {
  // Submit Magnet URI
  var submit = function (magnetURI) {
    return $http({
      method: 'POST',
      url: '/api/magnets',
      data: {'magnetURI': magnetURI}
    });
  };

  // Retrieve n number of latest magnets
  var getLatestMagnets = function(amount){
    return $http({
      method: 'GET',
      url:'api/magnets/latest/'+amount
    });
  };

  return {
    'submit': submit,
    'getLatestMagnets': getLatestMagnets
  };
});
