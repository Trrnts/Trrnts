var redis = require('../redis');
var geoip = require('geoip-lite');
var _ = require('lodash');

// Storing Format: 
// In Redis there will be a list containing all peers that need to mapped and stored, identified by geoQueue.
// Each peer from the list will be processed and stored in the Queue

// Map all peers stored in geoQueue & reset geoQueue
var geoMapWorker = function () {  
  // Using MULTI because need to delete key right after getting results.
  // That way no new items are added to queue in between LRANGE & DEL.
  var multi = redis.multi();
  multi.LRANGE('geoQueue', 0, -1);
  multi.DEL('geoQueue', redis.print);
  multi.exec(function (err, results) {
    if (err) {
      console.error(err);
    }

    _.each(results[0], mapPeer);
  });
};

// Map the geo Location for IP Address of a peer
var mapPeer = function (peer) {
  // Format InfoHash : ipAddress : port
  var peerArr = peer.split(':'); 
  var geoObj = geoip.lookup(peerArr[1]);  
  
  // format geoKey country : region : city : lat,long
  var geoKey = geoObj.country + ":" + geoObj.region + ":" + geoObj.city + ":" + geoObj.ll.toString();
    
  redis.LPUSH(geoKey, peerArr[0]);
  // Store all Geo location in Hash Table where each key is geoKey and the value represents the number of peers in that region.
  redis.HINCRBY('geoMap', geoKey, 1);
}

geoMapWorker();

