var _ = require('lodash');
var redis = require('../redis.js');

exports.Magnet = function(req, parsedMagnetURI){
  this.name = parsedMagnetURI.name;
  this.ip = req.headers
  this.infoHash = parsedMagnetURI.infoHash;
  this.createdAt = _.now();
  this.magnetURI = req.body.magnetURI;
  this.score = -1;

  redis.hmset('magnet:' + magnet.infoHash, magnet);
  redis.zadd('magnets:top', magnet.score, magnet.infoHash);
  redis.lpush('magnets:latest', magnet.infoHash);
  redis.sadd('magnets:ip:' + magnet.ip, magnet.infoHash);
  redis.rpush('magnets:crawl', magnet.infoHash);
};