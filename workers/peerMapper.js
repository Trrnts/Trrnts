var redis = require('../redis')(),
    geoip = require('geoip-lite'),
    _ = require('lodash'),
    queue = require('./queue');

// Map the geo Location for IP Address of a peer
queue.process('mapPeer', 4, function (job, done) {
  // Format IP Address : port
  var peerArr = job.data.peer.split(':');
  var geoObj = geoip.lookup(peerArr[0]);

  // geoip fails to on some ip address and returns null. For Now, check if geoObj is null and set it to ? for all properties.
  // Might need to change library
  if (geoObj === null) {
    console.log("failed geoip lookup");
    geoObj = {};
    geoObj.country = '?';
    geoObj.region = '?';
    geoObj.city = '?';
    geoObj.ll = '?,?';
  }

  // Region or city can be blank if geoip cannot retreive those.
  // This is fine, because string will be split on retrieval and it will
  // generate a blank element in split Array.
  var geoKey = geoObj.country + ':' + geoObj.region + ':' + geoObj.city + ':' + geoObj.ll.toString();

  var multi = redis.multi();
  multi.SADD(geoKey, peerArr[0]);

  // Store all Geo location in Hash Table where each key is geoKey and the value
  // represents the number of peers in that region.
  multi.HINCRBY('geo:map', geoKey, 1);

  multi.exec(done);
});
