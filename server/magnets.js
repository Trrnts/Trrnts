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
    multi.zrevrange(['magnet:' + infoHash + ':peers', 0, 50, 'WITHSCORES']);
  });
  multi.exec(function (err, results) {
    var magnets = [];

    // Every second result is the result of a ZREVRANGE (peer data for charts).
    _.each(_.range(0, results.length, 2), function (index) {
      results[index].peers = results[index+1];
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
      redis.sadd('magnets:all', magnet.infoHash);

      magnets.index(magnet);
      callback(null, magnet);
    }
  });
};

// readList('top', 10) #=> get top 10 magnets
magnets.readList = function (list, start, stop, callback) {
  redis.zrevrange('magnets:' + list, start, stop, function (err, infoHashes) {
    util.infoHashesToMagnets(infoHashes, callback);
  });
};

// readMagnet('chkdewyduewdg') #=> get a single magnet link
magnets.readMagnet = util.infoHashesToMagnets;

// search('Game of Thrones') #=> get all torrents that have those words, case-sensitive
magnets.search = function (query, start, stop, callback) {
  var keyNames = _.map(query.toLowerCase().split(' '), function (word) {
    return 'search:' + word;
  });

  var resultKeyName = 'search:query:' + query;
  var zinterstoreQuery = [resultKeyName, keyNames.length + 1];
  _.each(keyNames, function (keyName) {
    zinterstoreQuery.push(keyName);
  });
  zinterstoreQuery.push('magnets:top');
  zinterstoreQuery.push('AGGREGATE');
  zinterstoreQuery.push('MAX');

  redis.zinterstore(zinterstoreQuery, function (err) {
    redis.zrevrange(resultKeyName, start, stop, function (err, infoHashes) {
      util.infoHashesToMagnets(infoHashes, callback);
    });
  });
};

// Removes all non-alphanumeric charters from a string and removes multiple
// whitespaces. This is needed for extracting the words as an array from a
// string.
var extractWords = function (string) {
  string = string.toLowerCase();
  return string.replace(/\W/g, ' ').replace(/ +(?= )/g,'').split(' ');
};

// index(m1) #=> creates an inverted search index for a magnet object created by
// magnets.create(...).
magnets.index = function (magnet) {
  // This script indexes recently submitted magnets using an
  // [inverted index](http://en.wikipedia.org/wiki/Inverted_index).
  var words = extractWords(magnet.name);
  var multi = redis.multi();
  _.each(words, function (word) {
    multi.sadd('search:' + word.toLowerCase(), magnet.infoHash);
  });
  multi.exec();
};

module.exports = exports = magnets;
