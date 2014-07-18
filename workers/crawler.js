var bencode = require('bencode'),
    dgram = require('dgram'),
    hat = require('hat'),
    _ = require('lodash'),
    redis = require('../redis')();

// Put in a function. The returned function won't ever throw an error. This is
// quite useful for malformed messages.
var makeSafe = function (fn, onFuckedUp) {
  return function () {
    try {
      return fn.apply(null, arguments);
    } catch (e) {
      return onFuckedUp;
    }
  };
};

// See https://github.com/bencevans/node-compact2string.
var compact2string = makeSafe(require('compact2string'));

// Necessary formatting for the protocols we are using.
var transactionIdToBuffer = makeSafe(function (transactionId) {
  var buf = new Buffer(2);
  buf.writeUInt16BE(transactionId, 0);
  return buf;
});

// Necessary formatting for the protocols we are using.
var idToBuffer = makeSafe(function (id) {
  return new Buffer(id, 'hex');
});

// Time in ms for a crawlJob to live.
var ttl = 60*1000;

var decode = makeSafe(bencode.decode, {});
var encode = makeSafe(bencode.encode, {});

var BOOTSTRAP_NODES = [
  'router.bittorrent.com:6881',
  'router.utorrent.com:6881',
  'dht.transmissionbt.com:6881'
];

var nodeID = hat(160),
    port = 6881,
    socket = dgram.createSocket('udp4');

// Key: transactionId; Value: infoHash
var transactions = {};
// Key: infoHash; Value: Temporary key in database
var crawlJobs = {};

// This function will be invoked as soon as a node/peer sends a message. It does
// a lot of formatting for the protocols.
socket.on('message', function (msg, rinfo) {
  // console.log('Received message from ' + rinfo.address);
  msg = decode(msg);
  var transactionId = Buffer.isBuffer(msg.t) && msg.t.length === 2 && msg.t.readUInt16BE(0);
  var infoHash = transactions[transactionId];
  var job = crawlJobs[infoHash];
  if (!job) {
    console.log(msg);
    return;
  }
  if (msg.r && msg.r.values) {
    _.each(msg.r.values, function (peer) {
      peer = compact2string(peer);
      if (peer) {
        redis.pfadd(job + ':peers', peer, function (err, added) {
          if (added > 0) {
            getPeers(infoHash, peer);
          }
        });
      }
    });
  }
  if (msg.r && msg.r.nodes && Buffer.isBuffer(msg.r.nodes)) {
    for (var i = 0; i < msg.r.nodes.length; i += 26) {
      var node = compact2string(msg.r.nodes.slice(i + 20, i + 26));
      if (node) {
        redis.pfadd(job + ':nodes', node, function (err, added) {
          if (added > 0) {
            getPeers(infoHash, node);
          }
        });
      }
    }
  }
});

// Sends the get_peers request to a node.
var getPeers = function (infoHash, addr) {
  addr = addr.split(':');
  var ip = addr[0],
      port = parseInt(addr[1]);
  if (port <= 0 || port >= 65536) {
    return;
  }
  var transactionId = _.random(Math.pow(2, 16));
  transactions[transactionId] = infoHash;
  var message = encode({
    t: transactionIdToBuffer(transactionId),
    y: 'q',
    q: 'get_peers',
    a: {
      id: idToBuffer(nodeID),
      info_hash: idToBuffer(infoHash)
    }
  });
  socket.send(message, 0, message.length, port, ip);
};

var crawl = function (infoHash) {
  crawlJobs[infoHash] = _.random(Math.pow(10, 10));

  var job = crawlJobs[infoHash];
  redis.pexpire(job + ':peers', ttl*1.1);
  redis.pexpire(job + ':nodes', ttl*1.1);

  setTimeout(function () {
    console.log('Deleting crawlJob ' + infoHash + '...');
    redis.pfcount(job + ':peers', function (err, peers) {
      console.log(peers + ' peers');
      redis.del(job + ':peers');
    });
    redis.pfcount(job + ':nodes', function (err, nodes) {
      console.log(nodes + ' nodes');
      redis.del(job + ':nodes');
    });
    delete crawlJobs[infoHash];
  }, ttl);

  var kickedOff = 0;
  var kickOff = setInterval(function () {
    _.each(BOOTSTRAP_NODES, function (addr) {
      getPeers(infoHash, addr);
    });
    if (kickedOff++ === 10) {
      clearInterval(kickOff);
    }
  }, 10);
};

// Starts the DHT client by listening on the specified port.
socket.bind(port, function () {
  // Start the magic.
  crawl('7B390B9E1FC2631E21398317524CAE4985DCCEEE');
});
