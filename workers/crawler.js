var DHT = require('./dht'),
    redis = require('../redis')(),
    redisSubscribe = require('../redis')(),
    _ = require('lodash'),
    crawlJobQueue = require('./crawlJobQueue');

//In order to have multiple crawlers we need to be able to pass in the same dht
//instance to each of them
var dht = new DHT();

// We need a few "bootstrap nodes" as entry points for getting started.
var BOOTSTRAP_NODES = [
  'router.bittorrent.com:6881',
  'router.utorrent.com:6881',
  'dht.transmissionbt.com:6881'
];

// Uses an DHT instance in order to crawl the network.
var CrawlJob = function (infoHash) {
  this.infoHash = infoHash;
  this.timestamp = _.now();
  var kickOffCounter = 0;
  var kickOff = setInterval(function () {
    _.each(BOOTSTRAP_NODES, function (addr) {
      this.crawl(addr);
    }, this);
    if (++kickOffCounter === 10) {
      // Kick off crawler by crawling the bootstrap nodes 10 times.
      clearInterval(kickOff);
    }
  }.bind(this), 100);
};

CrawlJob.prototype.logNodesAndPeers = function () {
  console.log(_.keys(this.nodes).length + ' nodes');
  console.log(_.keys(this.peers).length + ' peers');
  console.log(this.timestamp);
};

// Recursively crawls the BitTorrent DHT protocol using an instance of the DHT
// class, which is a property of the instance of the CrawlJob.
CrawlJob.prototype.crawl = function (addr) {
  // _.each(this.nodes, function (tStamp, node) {
    // console.log('----------------------------------- INSIDE CRAWL');
    dht.getPeers(this.infoHash, addr, function (err, resp) {
      _.each(resp.nodes, function (node) {
        // this.nodes[node] = _.now();
        //add nodes to redis set
        redis.SADD('node', node);
      }, this);

      _.each(resp.peers, function (peer) {
        // this.peers[peer] = _.now();

        //add peers to redis set
        redis.SADD('peer', peer);

        //store each peer in a sorted set for its magnet. We will score each magnet by
        //seeing how many peers there are for the magnet in the last X minutes
        redis.ZADD('magnets:' + this.infoHash + ':peers', _.now(), peer);
        // redis.ZREVRANGE('magnets:' + infoHash + ':peers', 0, 0, 'withscores', function(err, resp) {
        //   console.log('----------------------------------- ' + resp);
        // });

        this.crawl(peer);
      }, this);

      if (!resp.peers) {
        // No peers -> crawl nodes.
        _.each(resp.nodes, function (node) {
          this.crawl(node);
        }, this);
      }
    }.bind(this));
  // }, this);

  // this.crawl();
  //current implementation simply kicks the crawler off every 100ms. This is not sustainable
  //and will be fixed in the future.
  // setTimeout(function () {
  // }.bind(this), 10);
  this.logNodesAndPeers();
};

dht.start(function () {
  // As soon as a new magnet is being submitted, its infoHash will be published
  // to the magnets:crawl channel.
  redisSubscribe.subscribe('magnets:crawl');

  redisSubscribe.on('message', function (channel, infoHash) {
    console.log('beginning new crawl for -----------------------------------> ' + infoHash);
    new CrawlJob(infoHash);
  });

  // At startup: Crawls uncrawled magnets in magnets:index set.
  redis.smembers('magnets:crawl', function (err, infoHashes) {
    _.each(infoHashes, function (infoHash) {
      console.log('beginning new crawl for -----------------------------------> ' + infoHash);
      new CrawlJob(infoHash);
    });
  });
});
