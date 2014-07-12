var DHT = require('./dht');
var redis = require('../redis.js')
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

      // Store all peers to the geoQueue       
      this.pushPeersToGeoQueue(resp.peers, infoHash);    
    }.bind(this));
  }, this);
  //current implementation simply kicks the crawler off every 100ms. This is not sustainable
  //and will be fixed in the future.
  // Crawls every node every 100 ms, which is not efficient. We only want to
  // crawl the the new nodes/ peers. TODO
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

Crawler.prototype.pushPeersToGeoQueue = function (peers, infoHash, callback) {
  if (!peers.length || infoHash === undefined) {    
    //console.log('Invalid infoHash or peers set');
    return;
  }

  // Each peer will have format infoHash:ipAddress:port. 
  // geoQueue is key, have to first element because of .apply
  var formattedPeers = ['geoQueue'];   
  _.each(peers, function (peer) {
    var formattedPeer = infoHash + ":" + peer;
    formattedPeers.push(formattedPeer);    
  });

  redis.LPUSH.apply(redis, formattedPeers); 
};


var crawler = new Crawler();
var infoHash = '7AE9924651F7E6A1E47C918C1256847DCA471BF9';

crawler.start(function () {
  crawler.crawl(infoHash, function (err, stats) {
  });
});