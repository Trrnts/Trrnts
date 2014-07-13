angular.module('trrntsApp.services', [])

.factory('MagnetLinksFactory', function ($http) {
  // Submit Magnet URI
  var submit = function (magnetURI) {
    return $http({
      method: 'POST',
      url: '/api/magnets',
      data: {'magnetURI': magnetURI}
    });
  };

  // Retrieve n number of latest magnets
  var getLatest = function (start, stop) {
    return $http({
      method: 'GET',
      url:'api/magnets/latest',
      params: {
        start: start || 1,
        stop: stop || 30
      }
    });
  };

  return {
    submit: submit,
    getLatest: getLatest
  };
});
