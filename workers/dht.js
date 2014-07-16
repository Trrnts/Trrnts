// Heads up! This is magic. Don't care too much about it. It simply works.

var bencode = require('bencode'),
    dgram = require('dgram'),
    hat = require('hat'),
    _ = require('lodash');

// compact2string might throw an error, but we don't want this. It should return
// null instead.
var compact2string = function(compact) {
  try {
    return require('compact2string')(compact);
  } catch (e) {
    return null;
  }
};

// Implements parts of BEP 5 (http://www.bittorrent.org/beps/bep_0005.html).
// We currenly only need the get_peers functionality (requesting peers).
var DHT = function (options) {
  options = options || {};
  // We need to define a node ID for our DHT instance, since it interacts with
  // the BitTorrent DHT network as a regular client.
  this.nodeID = options.nodeID || hat(160);
  // Port 6881 works best.
  this.port = options.port || '6881';
  this.socket = dgram.createSocket('udp4');
  // Each get_peers request has a unique transaction ID, which is the key of a
  // key-value pair stored in getPeersCallback. The value is the callback
  // function that will be called as soon as we receive a response.
  this.getPeersCallbacks = {};
  // We need to keep track of transaction IDs, since they need to be unique keys
  // for our getPeersCallbacks object.
  this.nextTransactionID = 0;
  this.socket.on('message', this._onMessage.bind(this));
};

// This function will be invoked as soon as a node sends a message.
DHT.prototype._onMessage = function (msg, rinfo) {
  try {
    msg = bencode.decode(msg);
  } catch (e) { return; }
  msg.t = Buffer.isBuffer(msg.t) && msg.t.length === 2 && msg.t.readUInt16BE(0);
  var callback = this.getPeersCallbacks[msg.t];
  if (callback) {
    var result = {};
    // peers have the torrent.
    result.peers = [];
    // nodes do not have the torrent, but are the nearest entries in the Hash
    // Table to it.
    result.nodes = [];
    if (msg.r && msg.r.values) {
      _.each(msg.r.values, function (peer) {
        peer = compact2string(peer);
        if (peer !== null) {
          result.peers.push(peer);
        }
      });
    }
    if (msg.r && msg.r.nodes && Buffer.isBuffer(msg.r.nodes)) {
      for (var i = 0; i < msg.r.nodes.length; i += 26) {
        var node = compact2string(msg.r.nodes.slice(i + 20, i + 26));
        if (node !== null) {
          result.nodes.push(node);
        }
      }
    }
    callback(null, result);
  }
};

// Starts the DHT client by listening on the specified port.
DHT.prototype.start = function (callback) {
  callback = callback || function () {  };
  this.socket.bind(this.port, function (exception) {
    callback.call(this, exception);
  }.bind(this));
};

DHT.prototype._transactionIdToBuffer = function (transactionId) {
  var buf = new Buffer(2);
  buf.writeUInt16BE(transactionId, 0);
  return buf;
};

DHT.prototype._idToBuffer = function (id) {
  return new Buffer(id, 'hex');
};

// Sends the get_peers request to a node.
DHT.prototype.getPeers = function (infoHash, address, callback) {
  callback = callback || function () {  };
  if(this.nextTransactionID > 50000) {
    this.nextTransactionID = 1;
  }
  var transactionID = this.nextTransactionID++;
  var message = bencode.encode({
    t: this._transactionIdToBuffer(transactionID),
    //BitTorrent protocol assumes this object has these properties. Single letter styling
    // is required by the protocol
    // y set to q means it's a query
    // q indicates the kind of query
    // a are the named arguments to the query
    y: 'q',
    q: 'get_peers',
    a: {
      id: this._idToBuffer(this.nodeID),
      info_hash: this._idToBuffer(infoHash)
    }
  });
  var port = address.split(':')[1];
  var ip = address.split(':')[0];

  if (parseInt(port) < 1 || parseInt(port) > 65535) {
    return callback(new TypeError('Invalid port'), {});
  }

  this.socket.send(message, 0, message.length, port, ip, function (exception) {
    this.getPeersCallbacks[transactionID] = callback;
    setTimeout(function () {
      delete this.getPeersCallbacks[transactionID];
      // Deletes "itself" from the getPeersCallbacks object if we didn't receive
      // an answer within the next 1000 ms
    }.bind(this), 1000);
  }.bind(this));
};

// See crawler.js for usage example.
module.exports = exports = DHT;
