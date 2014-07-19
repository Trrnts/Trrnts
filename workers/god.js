var crawl = require('./crawl');
    // redis = require('../redis')(),
    // geoip = require('geoip-lite');


crawl.init(function () {

  // var next = function () {
  //   redis.lpop('magnets:crawl', function (err, infoHash) {
  //     redis.rpush('magnets:crawl', infoHash);
  //     if (infoHash) {
  //       crawl(infoHash);
  //     }
  //   });
  // };
  // next();
  // setInterval(next, ttl*1.2);

// redis.zadd('magnet:' + infoHash + ':peers', _.now(), peers);
// redis.hset('magnet:' + infoHash, 'score', peers);
// redis.zadd('magnets:top', peers, infoHash);


// redis.pfcount('job:' + infoHash + ':peers', function (err, peers) {
//   console.log('Found ' + peers + ' peers for ' + infoHash);
//   redis.zadd('magnet:' + infoHash + ':peers', _.now(), peers);
//   redis.hset('magnet:' + infoHash, 'score', peers);
//   redis.zadd('magnets:top', peers, infoHash);
//   redis.del('job:' + infoHash + ':peers');
// });
// redis.pfcount('job:' + infoHash + ':nodes', function (err, nodes) {
//   console.log('Found ' + nodes + ' nodes for ' + infoHash);
//   redis.zadd('magnet:' + infoHash + ':nodes', _.now(), nodes);
//   redis.del('job:' + infoHash + ':nodes');
// });

// var ip = peer.split(':')[0];
// var geo = geoip.lookup(ip) || {};
// geo.country = geo.country || '?';
// geo.region = geo.region || '?';
// geo.city = geo.city || '?';
// geo.ll = geo.ll || ['?', '?'];
// geo.ll = geo.ll.join(',');
//
// redis.pfadd('peers', peer, function (err, added) {
//   if (added > 0) {
//     redis.zincrby('geo:countries', 1, geo.country);
//     redis.zincrby('geo:regions', 1, geo.region);
//     redis.zincrby('geo:cities', 1, geo.city);
//     redis.zincrby('geo:ll', 1, geo.ll);
//
//     redis.lpush('nodes', peer);
//   }
// });
//
// redis.pfadd('job:' + infoHash + ':peers', peer, function (err, added) {
//   if (added > 0) {
//     console.log('Found new peer ' + peer + ' for ' + infoHash);
//     if (active[infoHash]) {
//       getPeers(infoHash, peer);
//     }
//   }
// });

  crawl('8CA378DBC8F62E04DF4A4A0114B66018666C17CD', function (err, results) {
    console.log(results);
    process.exit(1);
  });
});
