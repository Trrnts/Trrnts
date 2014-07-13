var express = require('express'),
    magnets = require('./magnets');

var router = express.Router();

// http://localhost:9000/api/magnets
router.post('/magnets', function (req, res) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  magnets.create(ip, req.body.magnetURI, function (err, magnet) {
    if (err) {
      res.send(400, {error: err.message});
    } else {
      // Send back magnet when successful.
      res.send(200, magnet);
    }
  });
});

// http://localhost:9000/api/nodes
// this get request will return all of the nodes in the 'node' set of the database
// it returns an array of strings in the format of "ipadress:port"
router.get('/nodes', function (req, res) {
  redis.SMEMBERS('node', function(error, result) {
    res.send(result);
  });
});

router.get('/peers', function (req, res) {
  redis.SMEMBERS('peer', function(error, result) {
    res.send(result);
  });
});

// http://localhost:9000/api/magnets/top or /latest
router.get('/magnets/:list/:num?', function (req, res, next) {
  var list = req.params.list;
  if (['top', 'latest'].indexOf(list) !== -1) {
    var num = (req.params.num && parseInt(req.params.num)) || 10;
    magnets.readList(list, num, function (err, top) {
      res.send(200, top);
    });
  } else {
    return next();
  }
});

module.exports = exports = router;
