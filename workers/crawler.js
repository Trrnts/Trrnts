var DHT = require('./dht');

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
  setTimeout(function () {
    this.crawl(infoHash);
  }.bind(this), 100);
  console.log(_.keys(this.nodes).length + ' nodes');
  console.log(_.keys(this.peers).length + ' peers');
};

Crawler.prototype.start = function (callback) {
  this.dht.start(callback);
};

var crawler = new Crawler();

crawler.start(function () {
  crawler.crawl('7AE9924651F7E6A1E47C918C1256847DCA471BF9', function (err, stats) {
  });
});
