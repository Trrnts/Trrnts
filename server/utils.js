//convert a magnet into an object that has all the things it might need within the application

//worry about where to put it later

//properties
//methods
//make sure to set up the prototyping correctly

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

// var magnet = {
//   createdAt: new Date().getTime(),
//   name: parsedMagnetURI.name,
//   magnetURI: magnetURI,
//   ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
//   infoHash: parsedMagnetURI.infoHash,
//   score: -1 // Score: Indicate that this magnet has not been crawled yet.
// };