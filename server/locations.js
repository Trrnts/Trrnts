var locations = {},
    _ = require('lodash'),
    redis = require('../redis')();

locations.getByLatAndLong = function (number, callback) {
  getData('ll', number, callback);
};

locations.getByCountry = function (number, callback) {
  getData('countries', number, callback);
};

locations.getByRegion = function (number, callback) {
  getData('regions', number, callback);
};

locations.getByCity = function (number, callback) {
  getData('cities', number, callback);
};

// Get set amount of data for a specified type of location set, in the order
// of highest to lowest.
var getData = function(type, number, callback) {
  redis.ZREVRANGE(['geo:' + type, 0, number, 'WITHSCORES'], function (err, results) {
    if (err || results === null) {
      return callback(err, {});
    }
    
    var data = {};

    // The resulting array is [location, locationScore, location, locationScore, ...]
    // This is why we only look at every second element in array.
    _.each(_.range(0, results.length, 2), function(index) {
      data[results[index]] = results[index + 1];
    });
    
    callback(err, data);
  });
};


module.exports = locations;