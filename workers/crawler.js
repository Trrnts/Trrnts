var DHT = require('./dht');
var redis = require('../redis.js')
var _ = require('lodash');

var Crawler = function () {
  this.dht = new DHT();
  var timestamp = _.now();
  this.nodes = {
    'router.bittorrent.com:6881': timestamp,
    'router.utorrent.com:6881': timestamp,
    'dht.transmissionbt.com:6881': timestamp
  };
  this.peers = {};
};

Crawler.prototype.crawl = function (infoHash, callback) {
  _.each(this.nodes, function (tStamp, node) {

    this.dht.getPeers(infoHash, node, function (err, resp) {
      _.each(resp.nodes, function (node) {

        this.nodes[node] = _.now();
        //add nodes to redis set
        redis.SADD('node', node, redis.print);

      }, this);

      _.each(resp.peers, function (peer) {
        this.peers[peer] = _.now();
      }, this);
    }.bind(this));
  }, this);

  //current implementation simply kicks the crawler off every 100ms. This is not sustainable
  //and will be fixed in the future.
  setTimeout(function () {
    this.crawl(infoHash);
  }.bind(this), 100);

  console.log('nodes.length');
  console.log(_.keys(this.nodes).length + ' nodes');
  console.log(_.keys(this.peers).length + ' peers');
};

Crawler.prototype.start = function (callback) {
  this.dht.start(callback);
};

var crawler = new Crawler();
var infoHash = '7AE9924651F7E6A1E47C918C1256847DCA471BF9';

crawler.start(function () {
  crawler.crawl(infoHash, function (err, stats) {
  });
});
