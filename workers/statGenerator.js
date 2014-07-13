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
  multi.SMEMBERS('geo:queue');
  multi.DEL('geo:queue', redis.print);
  multi.exec(function (err, results) {
    if (err) {
      console.error(err);
    }
        
    _.each(results[0], mapPeer);    
  });
};

// Map the geo Location for IP Address of a peer
var mapPeer = function (peer) {
  // Format IP Address : port
  var peerArr = peer.split(':'); 
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
  
  // region or city can be blank if geoip cannot retreive those. 
  // This is fine, because on retreival string will be split and 
  // it will generate a blank element in split Array .
  var geoKey = geoObj.country + ":" + geoObj.region + ":" + geoObj.city + ":" + geoObj.ll.toString();
  redis.SADD(geoKey, peerArr[0]);
  // Store all Geo location in Hash Table where each key is geoKey and the value represents the number of peers in that region.
  redis.HINCRBY('geo:map', geoKey, 1);
}

geoMapWorker();

