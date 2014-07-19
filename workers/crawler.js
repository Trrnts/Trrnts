var bencode = require('bencode'),
    dgram = require('dgram'),
    hat = require('hat'),
    _ = require('lodash'),
    redis = require('../redis')(),
    geoip = require('geoip-lite');

// Put in a function. The returned function won't ever throw an error. This is
// quite useful for malformed messages.
var makeSafe = function (fn, onFuckedUp) {
  return function () {
    try {
      return fn.apply(null, arguments);
    } catch (e) {
      console.log(e);
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

var decode = makeSafe(bencode.decode, {}),
    encode = makeSafe(bencode.encode, {});

var ROUTERS = [
  'router.bittorrent.com:6881',
  'router.utorrent.com:6881',
  'dht.transmissionbt.com:6881'
  ],
  BOOTSTRAP_NODES = ROUTERS.slice();

var nodeID = hat(160),
    port = 6881,
    socket = dgram.createSocket('udp4');

// Update our id once in a while, since we are esentially spamming the DHT
// network and this might prevent other nodes from blocking us.
setInterval(function () {
  nodeID = hat(160);
}, 10000);

var active = {};

// Update BOOTSTRAP_NODES on a regular basis. This way is it more likely that a
// lookup will succeed.
setInterval(function () {
  console.log('Updating bootstrap nodes...');
  redis.lrange('nodes', 0, 50, function (err, nodes) {
    BOOTSTRAP_NODES = ROUTERS.concat(nodes);
    console.log('Finished updating bootstrap nodes.');
    redis.ltrim('nodes', 0, 50);
    _.each(active, function (bool, infoHash) {
      _.each(nodes, function (node) {
        getPeers(infoHash, node);
      });
    });
  });
}, 2000);

// Key: transactionId; Value: infoHash
var transactions = {};

// This function will be invoked as soon as a node/peer sends a message. It does
// a lot of formatting for the protocols.
socket.on('message', function (msg, rinfo) {
  // console.log('Received message from ' + rinfo.address);
  msg = decode(msg);
  var transactionId = Buffer.isBuffer(msg.t) && msg.t.length === 2 && msg.t.readUInt16BE(0);
  var infoHash = transactions[transactionId];
  if (!infoHash) {
    console.log('Unknown transaction for ' + transactionId + ' from ' + rinfo.address + ':' + rinfo.port);
    return;
  }
  if (msg.r && msg.r.values) {
    _.each(msg.r.values, function (peer) {
      peer = compact2string(peer);
      if (peer) {
        var ip = peer.split(':')[0];
        var geo = geoip.lookup(ip) || {};
        geo.country = geo.country || '?';
        geo.region = geo.region || '?';
        geo.city = geo.city || '?';
        geo.ll = geo.ll || ['?', '?'];
        geo.ll = geo.ll.join(',');

        redis.pfadd('peers', peer, function (err, added) {
          if (added > 0) {
            redis.zincrby('geo:countries', 1, geo.country);
            redis.zincrby('geo:regions', 1, geo.region);
            redis.zincrby('geo:cities', 1, geo.city);
            redis.zincrby('geo:ll', 1, geo.ll);
          }
        });

        redis.lpush('nodes', peer);
        redis.pfadd('job:' + infoHash + ':peers', peer, function (err, added) {
          if (added > 0) {
            console.log('Found new peer ' + peer + ' for ' + infoHash);
            if (active[infoHash]) {
              getPeers(infoHash, peer);
            }
          }
        });
      }
    });
  }
  if (msg.r && msg.r.nodes && Buffer.isBuffer(msg.r.nodes)) {
    var addNode = function (node) {
      return function (err, added) {
        if (added > 0) {
          console.log('Found new node ' + node + ' for ' + infoHash);
          if (active[infoHash]) {
            getPeers(infoHash, node);
          }
        }
      };
    };
    for (var i = 0; i < msg.r.nodes.length; i += 26) {
      var node = compact2string(msg.r.nodes.slice(i + 20, i + 26));
      if (node) {
        redis.lpush('nodes', node);
        redis.pfadd('job:' + infoHash + ':nodes', node, addNode(node));
      }
    }
  }
});

// Sends the get_peers request to a node.
var getPeers = function (infoHash, addr) {
  console.log('Sending get_peers to ' + addr + ' for ' + infoHash);
  addr = addr.split(':');
  var ip = addr[0],
      port = parseInt(addr[1]);
  if (port <= 0 || port >= 65536) {
    return;
  }
  // var transactionId = _.random(Math.pow(2, 16));
  var transactionId = _.random(Math.pow(2, 12));
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
  console.log('Crawling ' + infoHash + '...');

  active[infoHash] = true;

  setTimeout(function () {
    console.log('Done crawling ' + infoHash + '.');
    console.log('Storing results...');

    delete active[infoHash];

    redis.pfcount('job:' + infoHash + ':peers', function (err, peers) {
      console.log('Found ' + peers + ' peers for ' + infoHash);
      redis.zadd('magnet:' + infoHash + ':peers', _.now(), peers);
      redis.hset('magnet:' + infoHash, 'score', peers);
      redis.zadd('magnets:top', peers, infoHash);
      redis.del('job:' + infoHash + ':peers');
    });
    redis.pfcount('job:' + infoHash + ':nodes', function (err, nodes) {
      console.log('Found ' + nodes + ' nodes for ' + infoHash);
      redis.zadd('magnet:' + infoHash + ':nodes', _.now(), nodes);
      redis.del('job:' + infoHash + ':nodes');
    });
  }, ttl);

  // Packages might get lost. This sends each get_peers request multiple times.
  // Routers provided by BitTorrent, Inc. are sometimes down. This way we
  // ensure that we corrently enter the DHT network. Otherwise, we might not get
  // a single peer/ node.
  var kickedOff = 0;
  var kickOff = setInterval(function () {
    _.each(BOOTSTRAP_NODES, function (addr) {
      getPeers(infoHash, addr);
    });
    if (!active[infoHash] || ++kickedOff === 5) {
      clearInterval(kickOff);
    }
  }, 100);
};

// Starts the DHT client by listening on the specified port.
socket.bind(port, function () {
  // Start the magic.
  // crawl('8CA378DBC8F62E04DF4A4A0114B66018666C17CD');
  var next = function () {
    redis.lpop('magnets:crawl', function (err, infoHash) {
      redis.rpush('magnets:crawl', infoHash);
      if (infoHash) {
        crawl(infoHash);
      }
    });
  };
  next();
  setInterval(next, ttl*1.2);
});
