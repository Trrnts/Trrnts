var DHT = require('./dht'),
    // See http://redis.io/commands for excellent documention on Redis commands.
    redis = require('../redis')(),
    _ = require('lodash'),
    // See queue.js, which uses the kue library.
    queue = require('./queue');

// In order to have multiple crawlers, we need to be able to pass in the same
// dht instance to each of them. Otherwise we would need to start listening on a
// new port each time we create a new dht/ crawlJob instance, which would be
// quite inefficient.
var dht = new DHT();

// We need a few "bootstrap nodes" as entry points for getting started.
var BOOTSTRAP_NODES = [
  'router.bittorrent.com:6881',
  'router.utorrent.com:6881',
  'dht.transmissionbt.com:6881'
];

//Uses a DHT instance in order to crawl the network. See dht.js.
var CrawlJob = function (job, done) {
  this.job = job;
  this.infoHash = job.data.infoHash;
  this.startedAt = _.now();
  this.done = done;
  // TTL = Time to live. This is the amount of time in milliseconds we want this
  // crawl job to work.
  this.ttl = 10*1000;
  var kickOffCounter = 0;

  this.job.log('Kicking off crawl job...');

  // Kick off crawler by crawling the bootstrap nodes 10 times. This is
  // necessary, since UDP packages might get lost.
  var kickOff = setInterval(function () {
    kickOffCounter++;
    this.job.log('Crawling bootstrap nodes (' + kickOffCounter + '. kick)...');
    _.each(BOOTSTRAP_NODES, function (addr) {
      this.crawl(addr);
    }, this);
    this.job.log('Finished invoking crawl function on bootstrap nodes.');

    // Stop kicking off the bootstrap nodes after 10 iterations.
    if (kickOffCounter === 10) {
      clearInterval(kickOff);
      this.job.log('Finished kicking of crawl job.');
    }
  }.bind(this), 10);

  // Invoke crawlJobQueue's done callback function after 10 seconds. Passing in
  // infoHash so that we can queue the same infoHash to be crawled again later.
  setTimeout(function () {
    // First argument to this.done is for if there is an error. Since there's no
    // error, we set to null.
    this.job.log('Stop crawling after timeout.');
    this.job.log('Clone job and add to job queue.');
    this.done(null, {
      infoHash: this.infoHash
    });
  }.bind(this), this.ttl);
};

// Recursively crawls the BitTorrent DHT protocol using an instance of the DHT
// class.
CrawlJob.prototype.crawl = function (addr) {
  this.job.progress(_.now() - this.startedAt, this.ttl);
  // Crawls need to stop after 10 seconds, or some time, or else they would
  // crawl 'forever'.
  if (_.now() - this.startedAt > this.ttl) {
    this.job.log('Abort execution of crawl-function (timeout).');
    return;
  }

  this.job.log('Crawling ' + addr + '...');
  // See dht.js for description of getPeers-method.
  dht.getPeers(this.infoHash, addr, function (err, resp) {
    // Nodes do not contain the magnet, but they have information about where
    // peers, which do have the magnet, are located. We do not have a good
    // reason to store them in the database, but we are anyways.
    _.each(resp.nodes, function (node) {
      redis.SADD('node', node);
    }, this);

    // Peers have the magnet we are looking for. Storing them by themselves is
    // not yet useful, but we do it anyways.
    _.each(resp.peers, function (peer) {
      redis.SADD('peer', peer);

      // Store each peer in a sorted set for its magnet. We will score each
      // magnet by seeing how many peers there are for the magnet in the last X
      // minutes.
      redis.ZADD('magnets:' + this.infoHash + ':peers', _.now(), peer);

      // Here is the recursive call.
      this.crawl(peer);
    }, this);

    // If there were no peers to crawl, then we crawl the nodes in order to find
    // more peers.
    if (resp.peers.length === 0) {
      this.job.log('No peers to crawl. Crawl nodes instead.');
      _.each(resp.nodes, function (node) {
        this.crawl(node);
      }, this);
    }
    this.job.log('Finished crawling ' + addr + '.');
  }.bind(this));
};

// See dht.js.
dht.start(function () {
  // As soon as a new magnet is being submitted to the database from the client
  // side, its infoHash will be published to a certain channel. Kue takes care
  // of that and creates a new job etc.
  // 2 refers to the number of concurrent crawl jobs we want to run. Increment
  // at your own risk. It might break your computer/ server.
  queue.process('crawl', 2, function (job, done) {
    // See below for instantiation of job variable.
    new CrawlJob(job, done);
  });

  queue.on('job complete', function(id, result) {
    // This instantiates a job instance for the kue library called "crawl".
    // We can now create proccesses by this same name (see above) and use kue's
    // functionality on it.
    var job = queue.create('crawl', {
      title: 'Recursive crawl of ' + result.infoHash,
      infoHash: result.infoHash
    }).save(function (err) {
      if (err) {
        console.error('Experienced error while creating new job (id: ' + job.id + '): ' + err.message);
        console.error(err.stack);
      }
    });
  });
});
