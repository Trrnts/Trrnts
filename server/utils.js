var _ = require('lowdash');
var redis = require('../redis');

exports.Magnet = function(req, parsedMagnetURI){
  this.name = parsedMagnetURI.name;
  this.ip = req.headers
  this.infoHash = parsedMagnetURI.infoHash;
  this.createdAt = _.now();
  this.magnetURI = magnetURI;
  this.score = -1;
};