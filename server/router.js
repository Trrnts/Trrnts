var express = require('express'),
    redis = require('../redis'),
    parseMagnetURI = require('magnet-uri'),
    _ = require('lodash');

var router = express.Router();

// http://localhost:9000/api/magnets
router.post('/magnets', function (req, res) {
  var magnetURI = req.body.magnetURI;
  var parsedMagnetURI = {};
  try {
    parsedMagnetURI = parseMagnetURI(magnetURI);
  } catch (e) {  }
  // Empty parsed object -> invalid magnet link!
  if (_.isEmpty(parsedMagnetURI)) {
    res.send({'error': 'Invalid Magnet URI'});
    return;
  }
  // Don't insert duplicates!
  redis.exists('magnet:' + parsedMagnetURI.infoHash, function (err, exists) {
    if (exists) {
      res.send({'error': 'This Magnet URI has already been submitted'});
    } else {
      // Everything is ok, insert Magnet into database.
      // Create an empty magnet object.
      var magnet = {
        createdAt: new Date().getTime(),
        name: parsedMagnetURI.name,
        magnetURI: magnetURI,
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        infoHash: parsedMagnetURI.infoHash,
        score: -1 // Score: Indicate that this magnet has not been crawled yet.
      };
      // magnet:[infoHash] instead of magnets:[infoHash], since infoHash might
      // be 'latest' -> Security risk
      redis.hmset('magnet:' + magnet.infoHash, magnet);
      redis.zadd('magnets:createdAt', magnet.createdAt, magnet.infoHash);
      redis.zadd('magnets:top', -1, magnet.score);
      redis.lpush('magnets:latest', magnet.infoHash);
      redis.sadd('magnets:ip:' + magnet.ip, magnet.infoHash);
      redis.rpush('magnets:crawl', magnet.infoHash);

      // Insertion complete.
      res.send(magnet);
    }
  });
});

// http://localhost:9000/api/magnets/top
router.get('/magnets/top', function (req, res) {
  res.send('Hello World!');
});

// http://localhost:9000/api/magnets/latest
router.get('/magnets/latest', function (req, res) {
  res.send('Hello World!');
});

module.exports = router;
