var DHT = require('./dht'),
    //See redis.io for excellent documention on redis.
    redis = require('../redis')(),
    //Subscription service will allow us to fire events when there is a change in
    //the database
    redisSubscribe = require('../redis')(),
    _ = require('lodash'),
    //See crawlJobQueue.js, which uses the kue library
    crawlJobQueue = require('./crawlJobQueue');

//In order to have multiple crawlers we need to be able to pass in the same dht
//instance to each of them
var dht = new DHT();

//We need a few "bootstrap nodes" as entry points for getting started.
var BOOTSTRAP_NODES = [
  'router.bittorrent.com:6881',
  'router.utorrent.com:6881',
  'dht.transmissionbt.com:6881'
];

//Uses a DHT instance in order to crawl the network. See dht.js.
var CrawlJob = function (infoHash, done) {
  console.log('Crawling ' + infoHash);

  this.infoHash = infoHash;
  this.startedAt = _.now();
  this.done = done;
  var kickOffCounter = 0;

  //Kick off crawler by crawling the bootstrap nodes 10 times.
  var kickOff = setInterval(function () {
    _.each(BOOTSTRAP_NODES, function (addr) {
      this.crawl(addr);
    }, this);
    
    //Stop kicking off the bootstrap nodes after 10 times.
    if (++kickOffCounter === 10) {
      clearInterval(kickOff);
    }
  }.bind(this), 100);

  //Invoke crawlJobQueue's done callback function after 10 seconds. Passing in infoHash so that
  //we can queue the same infohash to be crawled again later.
  setTimeout(function () {
    //First argument to this.done is for if there is an error. Since there's no
    //error we set to null.
    this.done(null, {
      infoHash: this.infoHash
    });
  }.bind(this), 1000*10);
};

// Recursively crawls the BitTorrent DHT protocol using an instance of the DHT class.
CrawlJob.prototype.crawl = function (addr) {
  //Crawls need to stop after 10 seconds, or some time, or else they would crawl 'forever'.
  if (_.now() - this.startedAt > 1000*10) {
    return;
  }

  //See dht.js for description of dht.getPeers
  dht.getPeers(this.infoHash, addr, function (err, resp) {

    //Nodes do not contain the magnet, but they have information about where peers, which
    //do have the magnet, are located. We do not have a good reason to store them in the 
    //database, but we are anyways.
    _.each(resp.nodes, function (node) {
      redis.SADD('node', node);
    }, this);

    //Peers contain the magnet we are looking for. Storing them by themselves is not yet
    //useful but we do it anyways.
    _.each(resp.peers, function (peer) {
      redis.SADD('peer', peer);

      //Store each peer in a sorted set for its magnet. We will score each magnet by
      //seeing how many peers there are for the magnet in the last X minutes.
      redis.ZADD('magnets:' + this.infoHash + ':peers', _.now(), peer);

      //Here is the recursive call
      this.crawl(peer);
    }, this);

    //If there were no peers to crawl, then we crawl the nodes in order to find more peers.
    if (resp.peers.length === 0) {
      _.each(resp.nodes, function (node) {
        this.crawl(node);
      }, this);
    }
  }.bind(this));
};

//See dht.js
dht.start(function () {
  //As soon as a new magnet is being submitted to the database from the client side,
  //its infoHash will be published to the magnets:crawl channel.
  //2 refers to the number of concurrent crawl jobs we want to run. Increment at your own risk.
  crawlJobQueue.process('crawl', 2, function (job, done) {
    //See below for instantiation of job variable.
    var infoHash = job.data.infoHash;
    new CrawlJob(infoHash, done);
  });

  crawlJobQueue.on('job complete', function(id, result) {

    //This instantiates a job instance for the que library called 'crawl.
    //We can now create proccesses by this same name (see above) and use que's
    //functionality on it.
    var job = crawlJobQueue.create('crawl', {
      infoHash: result.infoHash
    }).save(function (err) {
      if(!err) {
        console.log(job.id);
      }
    });
  });
});
