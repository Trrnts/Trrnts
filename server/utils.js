var _ = require('lodash');
var redis = require('../redis.js');

exports.Magnet = function(req, parsedMagnetURI){
  this.name = parsedMagnetURI.name;
  this.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  this.infoHash = parsedMagnetURI.infoHash;
  this.createdAt = _.now();
  this.magnetURI = req.body.magnetURI;
  this.score = -1;

  redis.hmset('magnet:' + this.infoHash, this);
  redis.zadd('magnets:top', this.score, this.infoHash);
  redis.zadd('magnets:latest', this.createdAt, this.infoHash);
  redis.sadd('magnets:ip:' + this.ip, this.infoHash);
  redis.rpush('magnets:crawl', this.infoHash);
};
