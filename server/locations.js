var locations = {},
    _ = require('lodash'),
    redis = require('../redis')();

locations.getByLatAndLong = function (callback) {
  // get all lls 
  redis.ZRANGE(['geo:ll', 0, -1, 'WITHSCORES'], function (err, results) {
    if (err || results === null) {
      return callback(err, results);
    }
    
    var latAndLong = {};

    _.each(_.range(0, results.length, 2), function(index) {
      latAndLong[results[index]] = results[index + 1];
    });
    console.log("locations", latAndLong, results);
    callback(latAndLong);
  });
};




module.exports = locations;