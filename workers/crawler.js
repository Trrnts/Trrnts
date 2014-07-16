var DHT = require('./dht');
var redis = require('../redis')();
var redisSubscribe = require('../redis')();
var _ = require('lodash');

//In order to have multiple crawlers we need to be able to pass in the same dht
//instance to each of them
var dht = new DHT();

// Uses an DHT instance in order to crawl the network.
var Crawler = function (dht) {
  this.timestamp = _.now();
  // Addresses as keys, since we need constant time insert operations and unique
  // entries (inserts every node only once).
  // We need a few "bootstrap nodes" as entry points for getting started.
  this.nodes = {
    'router.bittorrent.com:6881': this.timestamp,
    'router.utorrent.com:6881': this.timestamp,
    'dht.transmissionbt.com:6881': this.timestamp
  };
  this.peers = {};
};

var _onReady = function () {
  // // As soon as a new magnet is being submitted, its infoHash will be published
  // // to the magnets:crawl channel.
  // redisSubscribe.subscribe('magnets:crawl');
  // redisSubscribe.on('message', function (channel, infoHash) {
  //   console.log('-----------------------------------> resisSubscribe.on');
  //   var crawler = new Crawler(dht);
  //   crawler.crawl(infoHash);
  //   // this.crawl(infoHash);
  // });

  // // At startup: Crawls uncrawled magnets in magnets:index set.
  // redis.smembers('magnets:crawl', function (err, infoHashes) {
  //   _.each(infoHashes, function (infoHash) {
  //     console.log('beginning new crawl for -----------------------------------> ' + infoHash);
  //     var crawler = new Crawler(dht);
  //     crawler.crawl(infoHash);
  //   });
  // });
};

Crawler.prototype.logNodesAndPeers = function () {
  console.log(_.keys(this.nodes).length + ' nodes');
  console.log(_.keys(this.peers).length + ' peers');
  console.log(this.timestamp);
};

// Recursively crawls the BitTorrent DHT protocol using an instance of the DHT
// class, which is a property of the instance of the crawler.
Crawler.prototype.crawl = function (infoHash) {
  _.each(this.nodes, function (tStamp, node) {
    // console.log('----------------------------------- INSIDE CRAWL');
    dht.getPeers(infoHash, node, function (err, resp) {

      _.each(resp.nodes, function (node) {

        this.nodes[node] = _.now();
        //add nodes to redis set
        redis.SADD('node', node);


      }, this);

      _.each(resp.peers, function (peer) {
        this.peers[peer] = _.now();

        //add peers to redis set
        redis.SADD('peer', peer);

        //store each peer in a sorted set for its magnet. We will score each magnet by
        //seeing how many peers there are for the magnet in the last X minutes
        redis.ZADD('magnets:' + infoHash + ':peers', _.now(), peer);
        // redis.ZREVRANGE('magnets:' + infoHash + ':peers', 0, 0, 'withscores', function(err, resp) {
        //   console.log('----------------------------------- ' + resp);
        // });                      
      }, this);

      // Store all peers to the geoQueue
      this.pushPeersToGeoQueue(resp.peers);
    }.bind(this));
  }, this);

  //current implementation simply kicks the crawler off every 100ms. This is not sustainable
  //and will be fixed in the future.
  // Crawls every node every 100 ms, which is not efficient. We only want to
  // crawl the the new nodes/ peers. TODO
  setTimeout(function () {
    this.crawl(infoHash);
  }.bind(this), 100);


  this.logNodesAndPeers();

};

Crawler.prototype.start = function (callback) {
  dht.start(callback);
};

Crawler.prototype.pushPeersToGeoQueue = function (peers) {
  if (!peers.length) {
    return;
  }

  // slice in order to not modify resp.peers
  // var formattedPeers = peers.slice();

  // Each peer will have format ipAddress:port.
  // geo:queue is needs to be first element because of .apply
  // formattedPeers.unshift('geo:queue');

  // redis.SADD.apply(null, formattedPeers);
};


var crawler = new Crawler(dht);
//TODO: set infoHash based on user submitted magnet links
var infoHash = '7AE9924651F7E6A1E47C918C1256847DCA471BF9';

crawler.start(function () {
  _onReady();
  crawler.crawl(infoHash, function (err, stats) {
  });
});

