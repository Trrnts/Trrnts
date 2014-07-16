var _ = require('lodash'),
    redis = require('../redis')(),
    parseMagnetURI = require('magnet-uri'),
    magnets = {};

var util = {};

// Converts a single infoHash/ an array of infoHashes into an array of magnet
// objects.
util.infoHashesToMagnets = function (infoHashes, callback) {
  if (!Array.isArray(infoHashes)) {
    infoHashes = [infoHashes];
  }
  var multi = redis.multi();
  _.each(infoHashes, function (infoHash) {
    multi.hgetall('magnet:' + infoHash);
    // TODO Caching
    multi.zrevrange(['magnet:' + infoHash + ':peers', 0, 10000, 'WITHSCORES']);
  });
  multi.exec(function (err, results) {
    var magnets = [];

    // Every second result is the result of a ZREVRANGE (peer data for charts).
    _.each(_.range(0, results.length, 2), function (index) {
      // Every second item in perrsWithScores is a score.
      var peersWithScores = results[index+1];

      results[index].peers = _.reduce(_.range(0, peersWithScores.length, 2), function (peers, index) {
        // debugger;
        var addr = peersWithScores[index];
        var lastSeenAt = Math.floor((parseInt(peersWithScores[index+1])/1000)/1); // group by 1 second intervalls for testing
        console.log(peers);
        peers[lastSeenAt] = peers[lastSeenAt] || 0;
        peers[lastSeenAt]++;
        return peers;
      }, {});

      if (results[index].peers) {
        console.log(results[index]);
      }
      magnets.push(results[index]);
    });

    callback(null, magnets);
  });
};

// create('127.0.0.1', 'magnet:?xt=urn:btih:c066...1337') #=> insert magnet URI
// into database
magnets.create = function (ip, magnetURI, callback) {
  var parsedMagnetURI = {};
  try {
    parsedMagnetURI = parseMagnetURI(magnetURI);
  } catch (e) {  }
  // Empty parsed object -> invalid magnet link!
  if (_.isEmpty(parsedMagnetURI)) {
    callback('Invalid Magnet URI');
    return;
  }
  // Don't insert duplicates!
  redis.exists('magnet:' + parsedMagnetURI.infoHash, function (err, exists) {
    if (exists) {
      callback(new Error('This Magnet URI has already been submitted'));
    } else {
      // Everything is ok, insert Magnet into database.
      // Create an empty magnet object.
      var magnet = {};
      magnet.name = parsedMagnetURI.name;
      magnet.ip = ip;
      magnet.infoHash = parsedMagnetURI.infoHash;
      magnet.createdAt = _.now();
      magnet.magnetURI = magnetURI;
      magnet.score = -1;

      redis.hmset('magnet:' + magnet.infoHash, magnet);
      redis.zadd('magnets:top', magnet.score, magnet.infoHash);
      redis.zadd('magnets:latest', magnet.createdAt, magnet.infoHash);
      redis.sadd('magnets:ip:' + magnet.ip, magnet.infoHash);
      redis.sadd('magnets:crawl', magnet.infoHash);
      redis.publish('magnets:crawl', magnet.infoHash);
      redis.sadd('magnets:index', magnet.infoHash);
      redis.publish('magnets:index', magnet.infoHash);

      callback(null, magnet);
    }
  });
};

// readList('top', 10) #=> get top 10 magnets
magnets.readList = function (list, start, stop, callback) {
  redis.zrevrange('magnets:' + list, -stop, -start, function (err, infoHashes) {
    util.infoHashesToMagnets(infoHashes, callback);
  });
};

// readMagnet('chkdewyduewdg') #=> get a single magnet link
magnets.readMagnet = util.infoHashesToMagnets;

module.exports = exports = magnets;
