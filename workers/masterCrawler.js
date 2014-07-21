var crawl = require('./crawl'),
    _ = require('lodash'),
    redis = require('../redis')(),
    geoip = require('geoip-lite');

var ttl = 20*1000;

crawl.init(function () {
  var onCrawled = function (infoHash) {
    return function (err, result) {
      if (err) {
        return;
      }
      redis.zadd('magnet:' + infoHash + ':peers', _.now(), result.peers.length);
      redis.hset('magnet:' + infoHash, 'peers', result.peers.length);
      redis.zadd('magnets:top', result.peers.length, infoHash);

      var geoMulti = redis.multi();

      _.each(result.peers, function (peer) {
        geoMulti.pfadd('peers', peer);
      });

      var geoIncrMulti = redis.multi();

      geoMulti.exec(function (err, addedArray) {
        _.each(addedArray, function (added, index) {
          if (added > 0) {
            var peer = result.peers[index];
            var ip = peer.split(':')[0];
            var geo = geoip.lookup(ip) || {};
            geo.country = geo.country || '?';
            geo.region = geo.region || '?';
            geo.city = geo.city || '?';
            geo.ll = geo.ll || ['?', '?'];
            geo.ll = geo.ll.join(',');

            geoIncrMulti.zincrby('geo:countries', 1, geo.country);
            geoIncrMulti.zincrby('geo:regions', 1, geo.region);
            geoIncrMulti.zincrby('geo:cities', 1, geo.city);
            geoIncrMulti.zincrby('geo:ll', 1, geo.ll);
          }
        });
        geoIncrMulti.exec();
      });
    };
  };

  var next = function () {
    // Crawl 4 infoHashes at a time.
    _.times(4, function () {
      redis.lpop('magnets:crawl', function (err, infoHash) {
        if (infoHash) {
          redis.rpush('magnets:crawl', infoHash);
          crawl(infoHash, ttl, onCrawled(infoHash));
        }
      });
    });
  };
  next();
  setInterval(next, ttl + 1000);
  // One second should be enough to store the data to the DB.


  // Example usage:
  // crawl('8CA378DBC8F62E04DF4A4A0114B66018666C17CD', function (err, results) {
  //   console.log(results);
  //
  //   process.exit(1);
  // });
});
