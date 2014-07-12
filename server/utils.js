var _ = require('lodash');
var redis = require('../redis.js');

exports.Magnet = function(req, parsedMagnetURI){
  this.name = parsedMagnetURI.name;
  this.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  this.infoHash = parsedMagnetURI.infoHash;
  this.createdAt = _.now();
  this.magnetURI = req.body.magnetURI;
  this.score = -1;

  redis.hmset('magnet:' + magnet.infoHash, magnet);
  redis.zadd('magnets:top', magnet.score, magnet.infoHash);
  redis.zadd('magnets:latest', magnet.infoHash, magnet.createdAt);
  redis.sadd('magnets:ip:' + magnet.ip, magnet.infoHash);
  redis.rpush('magnets:crawl', magnet.infoHash);
};