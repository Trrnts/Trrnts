var DHT = require('./dht'),
    // See http://redis.io/commands for excellent documention on Redis commands.
    redis = require('../redis')(),
    _ = require('lodash'),
    // See queue.js, which uses the kue library.
    queue = require('./queue'),
    cleaner = require('./cleaner'),
    geoip = require('geoip-lite');

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
  // Try to not crawl nodes/ peers twice. Computer freezes at about 40000
  // packages per second.
  this.alreadyCrawled = {};

  this.nodes = {};
  this.peers = {};

  this.job = job;
  this.infoHash = job.data.infoHash;
  this.startedAt = _.now();
  this.done = done;
  // TTL = Time to live. This is the amount of time in milliseconds we want this
  // crawl job to work.
  this.ttl = 60*1*1000;
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

    // Stop kicking off the bootstrap nodes after a certain number of
    // iterations.
    if (kickOffCounter === 5) {
      clearInterval(kickOff);
      this.job.log('Finished kicking of crawl job.');
    }
  }.bind(this), 10);

  // Send 1000 packages per seond at peak.
  var crawling = setInterval(function () {
    var nextAddrToCrawl = this.crawlQueue.shift();
    if (nextAddrToCrawl) {
      this.crawl(nextAddrToCrawl);
    }
  }.bind(this), 1);

  // Invoke crawlJobQueue's done callback function after 10 seconds. Passing in
  // infoHash so that we can queue the same infoHash to be crawled again later.
  setTimeout(function () {
    clearInterval(crawling);
    // First argument to this.done is for if there is an error. Since there's no
    // error, we set to null.
    this.job.log('Stop crawling after timeout.');
    this.job.log('Writing results to database...');

    var numPeers = _.keys(this.peers).length;
    var numNodes = _.keys(this.nodes).length;

    var peerLocations = _.reduce(this.peers, function (peerLocations, t, addr) {
      var location = geoip.lookup(addr.split(':')[0]) || {};
      location.ll = location.ll || [];
      location = location.ll.join('|');
      peerLocations[location] = peerLocations[location] || 0;
      peerLocations[location]++;
      return peerLocations;
    }, {});

    this.job.log('Found ' + numPeers + ' peers');
    this.job.log('Found ' + numNodes + ' nodes');

    var multi = redis.multi();

    multi.zadd('magnets:' + this.infoHash + ':peers', this.startedAt, numPeers);
    multi.zadd('magnets:' + this.infoHash + ':nodes', this.startedAt, numNodes);

    multi.zadd('magnets:' + this.infoHash + ':peers:locations', this.startedAt, JSON.stringify(peerLocations));

    multi.exec(function () {
      this.job.log('Inserted data into DB.');
      this.job.log('Clone job and add to job queue.');
      // This instantiates a job instance for the kue library called "crawl".
      // We can now create proccesses by this same name (see above) and use kue's
      // functionality on it.
      var job = queue.create('crawl', {
        title: 'Recursive crawl of ' + this.infoHash,
        infoHash: this.infoHash
      }).save(function (err) {
        if (err) {
          console.error('Experienced error while creating new job (id: ' + job.id + '): ' + err.message);
          console.error(err.stack);
        }
      });
      this.done(null);
    }.bind(this));

  }.bind(this), this.ttl);

  this.crawlQueue = [];
};

CrawlJob.prototype.enqueue = function (addr) {
  if (!this.alreadyCrawled[addr]) {
    this.crawlQueue.push(addr);
  }
};

// Recursively crawls the BitTorrent DHT protocol using an instance of the DHT
// class.
CrawlJob.prototype.crawl = function (addr) {
  // Mark that this addr has been crawled now.
  this.alreadyCrawled[addr] = true;

  // Crawls need to stop after 10 seconds, or some time, or else they would
  // crawl 'forever'.
  if (_.now() - this.startedAt > this.ttl) {
    this.job.log('Abort execution of crawl-function (timeout).');
    return;
  }

  // Don't log this for performance reasons.
  // this.job.log('Crawling ' + addr + '...');
  // See dht.js for description of getPeers-method.
  dht.getPeers(this.infoHash, addr, function (err, resp) {
    // Nodes do not contain the magnet, but they have information about where
    // peers, which do have the magnet, are located. We do not have a good
    // reason to store them in the database, but we are anyways.
    _.each(resp.nodes, function (node) {
      this.nodes[node] = true;
    }, this);

    // Peers have the magnet we are looking for. Storing them by themselves is
    // not yet useful, but we do it anyways.
    _.each(resp.peers, function (peer) {
      this.peers[peer] = true;

      // Here is the recursive call.
      this.enqueue(peer);
    }, this);

    // If there were no peers to crawl, then we crawl the nodes in order to find
    // more peers.
    if (resp.peers.length === 0) {
      _.each(resp.nodes, function (node) {
        this.enqueue(node);
      }, this);
    }
    // this.job.log('Finished crawling ' + addr + '.');
  }.bind(this));
};

// See dht.js.
dht.start(function () {
  // As soon as a new magnet is being submitted to the database from the client
  // side, its infoHash will be published to a certain channel. Kue takes care
  // of that and creates a new job etc.
  // 4 refers to the number of concurrent crawl jobs we want to run.
  // at your own risk. It might break your computer/ server.
  queue.process('crawl', 50, function (job, done) {
    // See below for instantiation of job variable.
    new CrawlJob(job, done);
  });
});
