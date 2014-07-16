angular.module('trrntsApp.services', [])

.factory('MagnetLinksFactory', ['$http', function ($http) {
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

  // searches torrents whose titles contains input.
  var search = function (input) {
    if (!input) {
      return;
    }

    return $http({
      method: 'GET',
      url:'api/magnets/'+input
    });
  };

  return {
    create: create,
    latest: latest,
    top: top,
    search:search
  };
}]);
