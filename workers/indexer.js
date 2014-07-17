// This script indexes recently submitted magnets in using
// [inverted index](http://en.wikipedia.org/wiki/Inverted_index).
// We use sets for this and intersect them later on.

var _ = require('lodash'),
    queue = require('./queue');
    redis = require('../redis')();

// Removes all non-alphanumeric charters from a string and removes multiple
// whitespaces. This is needed for extracting the words as an array from a
// string.
var extractWords = function (string) {
  string = string.toLowerCase();
  return string.replace(/\W/g, ' ').replace(/ +(?= )/g,'').split(' ');
};

// Indexes a magnet with a specific infoHash.
var index = function (job, done) {
  var infoHash = job.data.infoHash;
  job.log('Indexing ' + infoHash + '...');
  redis.hget('magnet:' + infoHash, 'name', function (err, name) {
    job.log('Building inverted index for ' + infoHash);
    job.log('Extracting words from ' + name + ' (infoHash: ' + infoHash + ')');
    var words = extractWords(name);
    job.log('Extracted words ' + words.join(', ') + ' (infoHash: ' + infoHash + ')');
    var multi = redis.multi();
    _.each(words, function (word) {
      multi.sadd('search:' + word.toLowerCase(), infoHash);
    });
    multi.exec(function () {
      job.log('Finished indexing.');
      done(null);
    });
  });
};

queue.process('index', 10, function (job, done) {
  index(job, done);
});
