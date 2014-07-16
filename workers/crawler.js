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
var CrawlJob = function (infoHash, done) {
  console.log('Crawling ' + infoHash);

  this.infoHash = infoHash;
  this.startedAt = _.now();
  this.done = done;
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
  setTimeout(function () {
    // Invoke done after 10 seconds.
    this.done(null, {
      infoHash: this.infoHash
    });
  }.bind(this), 1000*10);
};

// Recursively crawls the BitTorrent DHT protocol using an instance of the DHT
// class, which is a property of the instance of the CrawlJob.
CrawlJob.prototype.crawl = function (addr) {
  if (_.now() - this.startedAt > 10000) {
    return;
  }
  dht.getPeers(this.infoHash, addr, function (err, resp) {
    _.each(resp.nodes, function (node) {
      //add nodes to redis set
      redis.SADD('node', node);
    }, this);

    _.each(resp.peers, function (peer) {
      //add peers to redis set
      redis.SADD('peer', peer);

      //store each peer in a sorted set for its magnet. We will score each magnet by
      //seeing how many peers there are for the magnet in the last X minutes
      redis.ZADD('magnets:' + this.infoHash + ':peers', _.now(), peer);

      this.crawl(peer);
    }, this);

    if (resp.peers.length === 0) {
      // No peers -> crawl nodes.
      _.each(resp.nodes, function (node) {
        this.crawl(node);
      }, this);
    }
  }.bind(this));
};

dht.start(function () {
  // As soon as a new magnet is being submitted, its infoHash will be published
  // to the magnets:crawl channel.

  crawlJobQueue.process('crawl', function (job, done) {
    var infoHash = job.data.infoHash;
    new CrawlJob(infoHash, done);
  });

  crawlJobQueue.on('job complete', function(id, result) {
    //when a job is completed
      //add it to the queue again
        //get the infohash

    console.log(result.infoHash);

    var job = crawlJobQueue.create('crawl', {
      infoHash: result.infoHash
    }).save(function (err) {
      if(!err) {
        console.log(job.id);
      }
    });


    // kue.Job.get(id, function(err, job){
    //   if (err) return;
      // job.remove(function(err) {
      //   if (err) throw err;
      //   console.log('removed completed job #%d', job.id);
      //   console.log('Add completed job to queue');
      //   job = crawlJobQueue.create('crawl', {
      //     infoHash: job.data.infoHash
      //   }).save(function (err) {
      //     if(!err) console.log(job.id);
      //   });
      // });
    // });
  });
});
