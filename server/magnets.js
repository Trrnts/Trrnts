var _ = require('lodash'),
    redis = require('../redis')(),
    parseMagnetURI = require('magnet-uri'),
    magnets = {};

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
  redis.zrevrange('magnets:' + list, -stop, -start, function (err, replies) {
    var multi = redis.multi();
    _.map(replies, function (infoHash) {
      multi.hgetall('magnet:' + infoHash);
    });
    multi.exec(callback);
  });
};

// readMagnet('chkdewyduewdg') #=> get a single magnet link
magnets.readMagnet = function (infoHash, callback) {
  redis.hgetall('magnet:' + infoHash, callback);
};


magnets.search = function (search, callback) {    
  // Format : 'search:' + word    
  // Convert Each Word into a key Format 
  var formattedWords = _.map(search.split(' '), function (word) {
    return 'search:'+ word;
  });

  // Attach callback at end because of apply
  formattedWords.push(callback);
  redis.sinter.apply(null, formattedWords);
};

module.exports = exports = magnets;













