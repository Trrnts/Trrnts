var express = require('express'),
    redis = require('../redis'),
    parseMagnetURI = require('magnet-uri'),
    _ = require('lodash');

var router = express.Router();

// http://localhost:9000/api/magnets
router.post('/magnets', function (req, res) {
  console.log('post');
  var magnetURI = req.body.magnetURI;
  var parsedMagnetURI = {};
  try {
    parsedMagnetURI = parseMagnetURI(magnetURI);
  } catch (e) {  }
  // Empty parsed object -> invalid magnet link!
  if (_.isEmpty(parsedMagnetURI)) {
    res.send(400, {'error': 'Invalid Magnet URI'});
    return;
  }
  // Don't insert duplicates!
  redis.exists('magnet:' + parsedMagnetURI.infoHash, function (err, exists) {
    if (exists) {
      res.send(400, {'error': 'This Magnet URI has already been submitted'});
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
      redis.zadd('magnets:top', magnet.score, magnet.infoHash);
      redis.lpush('magnets:latest', magnet.infoHash);
      redis.sadd('magnets:ip:' + magnet.ip, magnet.infoHash);
      redis.rpush('magnets:crawl', magnet.infoHash);

      // Insertion complete.
      res.send(magnet);
    }
  });
});

// http://localhost:9000/api/nodes
// this get request will return all of the nodes in the 'node' set of the database
// it returns an array of strings in the format of "ipadress:port"
router.get('/nodes', function (req, res) {
  redis.SMEMBERS('node', function(error, result) {
    console.log(result);
    res.send(result);
  });
});

// http://localhost:9000/api/magnets/top or /latest
router.get('/magnets/:list/:num?', function (req, res, next) {
  if (['top', 'latest'].indexOf(req.params.list) === -1) {
    return next();
  }
  var num = (req.params.num && parseInt(req.params.num)) || 10;
  redis.ZRANGE('magnets:' + req.params.list, -num, -1, function(err, replies) {
    var multi = redis.multi();
    _.map(replies, function (infoHash) {
      multi.hgetall('magnet:' + infoHash);
    });
    multi.exec(function (err, replies) {
      res.send(replies);
    });
  });
});

module.exports = exports = router;
