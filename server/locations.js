var locations = {},
    _ = require('lodash'),
    redis = require('../redis')();

locations.getByLatAndLong = function (callback) {
  // get all lls 
  getData('ll', callback);
};

locations.getByCountry = function (callback) {
  getData('countries', callback);
};

locations.getByRegion = function (callback) {
  getData('regions', callback);
};

locations.getByCity = function (callback) {
  getData('cities', callback);
};

var getData = function(type, callback) {
  redis.ZRANGE(['geo:' + type, 0, -1, 'WITHSCORES'], function (err, results) {
    if (err || results === null) {
      return callback(err, {});
    }
    
    var data = {};

    _.each(_.range(0, results.length, 2), function(index) {
      data[results[index]] = results[index + 1];
    });

    console.log("locations " + type + ":", data, results);
    callback(data);
  });
};


module.exports = locations;