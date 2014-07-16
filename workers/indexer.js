// This script indexes recently submitted magnets in using
// [inverted index](http://en.wikipedia.org/wiki/Inverted_index).
// We use sets for this and intersect them later on.

var _ = require('lodash'),
    redisSubscribe = require('../redis')(),
    redisRegular = require('../redis')();

// Removes all non-alphanumeric charters from a string and removes multiple
// whitespaces. This is needed for extracting the words as an array from a
// string.
var extractWords = function (string) {
  return string.replace(/\W/g, ' ').replace(/ +(?= )/g,'').split(' ');
};

// Indexes a magnet with a specific infoHash.
var index = function (infoHash) {
  console.info('Indexing infoHash ' + infoHash);
  redisRegular.hget('magnet:' + infoHash, 'name', function (err, name) {
    console.log('Building inverted index for ' + infoHash);
    console.info('Extracting words from ' + name + ' (infoHash: ' + infoHash + ')');
    var words = extractWords(name);
    console.info('Extracted words ' + words.join(', ') + ' (infoHash: ' + infoHash + ')');
    _.each(words, function (word) {
      redisRegular.sadd('search:' + word, infoHash);
      redisRegular.srem('magnets:index', infoHash);
    });
  });
};

// As soon as a new magnet is being submitted, its infoHash will be published to
// the magnets:index channel.
redisSubscribe.subscribe('magnets:index');
redisSubscribe.on('message', function (channel, infoHash) {
  index(infoHash);
});

// At startup: Indexes unindexed magnets in magnets:index set.
(function () {
  redisRegular.smembers('magnets:index', function (err, infoHashes) {
    _.each(infoHashes, index);
  });
})();
