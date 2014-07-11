var DHT = require('./dht');
var _ = require('lodash');

// Uses an DHT instance in order to crawl the network.
var Crawler = function () {
  this.dht = new DHT();
  var timestamp = _.now();
  // Addresses as keys, since we need constant time insert operations and unique
  // entries (inserts every node only once).
  // We need a few "bootstrap nodes" as entry points for getting started.
  this.nodes = {
    'router.bittorrent.com:6881': timestamp,
    'router.utorrent.com:6881': timestamp,
    'dht.transmissionbt.com:6881': timestamp
  };
  this.peers = {};
};

// Recursively crawls the BitTorrent DHT protocol using an instance of the DHT
// class, which is a property of the instance of the crawler.
Crawler.prototype.crawl = function (infoHash, callback) {
  // We currenly only send the get_peers request to nodes, not to peers. TODO
  _.each(this.nodes, function (t, node) {
    this.dht.getPeers(infoHash, node, function (err, resp) {
      _.each(resp.nodes, function (node) {
        this.nodes[node] = _.now();
      }, this);
      _.each(resp.peers, function (peer) {
        this.peers[peer] = _.now();
      }, this);
    }.bind(this));
  }, this);
  // Crawls every node every 100 ms, which is not efficient. We only want to
  // crawl the the new nodes/ peers. TODO
  setTimeout(function () {
    this.crawl(infoHash);
  }.bind(this), 100);
  console.log(_.keys(this.nodes).length + ' nodes');
  console.log(_.keys(this.peers).length + ' peers');
};

Crawler.prototype.start = function (callback) {
  this.dht.start(callback);
};

// Example:
// var crawler = new Crawler();
// crawler.start(function () {
//   crawler.crawl('7AE9924651F7E6A1E47C918C1256847DCA471BF9', function (err, stats) {
//   });
// });
