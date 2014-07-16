var bencode = require('bencode'),
    dgram = require('dgram'),
    hat = require('hat'),
    _ = require('lodash'),
    redisSubscribe = require('../redis')(),
    redisRegular = require('../redis')();

// compact2string might throw an error, but we don't want this. It should return
// null instead.
var compact2string = function(compact) {
  try {
    return require('compact2string')(compact);
  } catch (e) {
    return null;
  }
};

var _transactionIdToBuffer = function (transactionId) {
  var buf = new Buffer(2);
  try {
    buf.writeUInt16BE(transactionId, 0);
  } catch (e) {  }
  return buf;
};

var _idToBuffer = function (id) {
  return new Buffer(id, 'hex');
};

// Generate random node ID out of 160-bit space.
var nodeID = hat(160);

// Port 6881 works best (standard port for many clients).
var port = 6881;

// Create socket.
var socket = dgram.createSocket('udp4');

// Each get_peers request has a unique transaction ID, which is the key of a
// key-value pair stored in getPeersCallback. The value is the callback
// function that will be called as soon as we receive a response.
var getPeersCallbacks = {};

// We need to keep track of transaction IDs, since they need to be unique keys
// for our getPeersCallbacks object.
var nextTransactionID = 0;

// This function will be invoked as soon as a node sends a message.
socket.on('message', function (msg, rinfo) {
  try {
    msg = bencode.decode(msg);
  } catch (e) { return; }
  msg.t = Buffer.isBuffer(msg.t) && msg.t.length === 2 && msg.t.readUInt16BE(0);
  var callback = getPeersCallbacks[msg.t] || _.noop;
  if (callback) {
    var result = {};
    // Peers have the torrent.
    result.peers = [];
    // Nodes do not have the torrent, but are the nearest entries in the hash
    // table to it.
    result.nodes = [];
    if (msg.r && msg.r.values) {
      result.peers = _.map(msg.r.values, compact2string);
    }
    if (msg.r && msg.r.nodes && Buffer.isBuffer(msg.r.nodes)) {
      for (var i = 0; i < msg.r.nodes.length; i += 26) {
        result.nodes.push(compact2string(msg.r.nodes.slice(i + 20, i + 26)));
      }
    }
    callback(null, result);
  }
});

// Start listening on specified port.
socket.bind(port, function (err) {
  if (err) {
    console.log('Couldn\'t start listening on port ' + port + ': ' + err.message);
    process.exit(1);
  }
  console.log('Successfully started listening on port ' + port);
  onReady();
});

// Sends the get_peers request to a node.
var getPeers = function (infoHash, address, callback) {
  callback = callback || _.noop;
  var transactionID = nextTransactionID++;
  var message = bencode.encode({
    t: _transactionIdToBuffer(transactionID),
    // BitTorrent protocol assumes this object has these properties. Single
    // letter styling is required by the protocol.
    // y set to q means it's a query
    // q indicates the kind of query
    // a are the named arguments to the query
    y: 'q',
    q: 'get_peers',
    a: {
      id: _idToBuffer(nodeID),
      info_hash: _idToBuffer(infoHash)
    }
  });
  if (parseInt(address.split(':')[1]) > 0 && parseInt(address.split(':')[1]) < 65536) {
    socket.send(message, 0, message.length, address.split(':')[1], address.split(':')[0], function () {
      getPeersCallbacks[transactionID] = callback;
      setTimeout(function () {
        delete getPeersCallbacks[transactionID];
        // Deletes "itself" from the getPeersCallbacks object if we didn't receive
        // an answer within the next 1000 ms
      }, 1000);
    });
  }
};

// Addresses as keys, since we need constant time insert operations and unique
// entries (inserts every node only once).
// We need a few "bootstrap nodes" as entry points for getting started.
// Nodes do not have the desired torrent, but are the neirest neighbors in the
// routing table to this specific torrent.
var BOOTSTRAP_NODES = [
  'router.bittorrent.com:6881',
  'router.utorrent.com:6881',
  'dht.transmissionbt.com:6881'
];

var onReady = function () {
  // As soon as a new magnet is being submitted, its infoHash will be published
  // to the magnets:crawl channel.
  redisSubscribe.subscribe('magnets:crawl');
  redisSubscribe.on('message', function (channel, infoHash) {
    crawl(infoHash);
  });

  // At startup: Crawls uncrawled magnets in magnets:index set.
  redisRegular.smembers('magnets:crawl', function (err, infoHashes) {
    _.each(infoHashes, crawl);
  });
};

var crawl = function (infoHash) {
  console.log('Started crawling ' + infoHash);
  redisRegular.srem('magnets:crawl', infoHash);
  var keepGoing = true;

  setTimeout(function () {
    console.log('Stopped crawling');
    keepGoing = false;
    redisRegular.sadd('magnets:crawl', infoHash);
    redisRegular.publish('magnets:crawl', infoHash);
  }, 10*1000); // crawl for 10 seconds.

  redisRegular.zrevrange('magnet:' + infoHash + ':peers', 1, 50, function (err, latestPeers) {
    // Magnet might not have been crawled before. Use BOOTSTRAP_NODES as entry
    // points in this case.
    _.each(latestPeers.concat(BOOTSTRAP_NODES), function (addr) {
      recurse(addr);
    });
  });

  var recurse = function (addr) {
    console.log('Crawling ' + addr + ' for ' + infoHash);
    if (!keepGoing) {
      console.log('Interupt crawling ' + addr + ' for ' + infoHash + '(terminated by crawler)');
      return;
    }
    getPeers(infoHash, addr, function (err, result) {
      _.each(result.peers, function (peer) {
        console.log(peer);
        redisRegular.zadd('magnet:' + infoHash + ':peers', _.now(), peer);
      });
      _(result.peers.concat(result.nodes)).each(function (addr) {
        recurse(addr);
      });
    });
  };
};
