angular.module('Trrnts.services', [])

.factory('magnetLinks', function($http) {    
  // Submit Magnet Links
  var submitMagnetLink = function (magnetLink) { 
    // Validation of magnetLink 
    if (magnetLink) {}
    
    return $http({
      method: 'POST',
      url: '/api/mangets',
      data: {'magnetURI': magnetLink}
    });  
  };

  return {
    'submitMagnetLink':submitMagnetLink
  };

});