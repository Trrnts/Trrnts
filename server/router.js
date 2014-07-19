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
// This get request will return all of the nodes in the 'node' set of the database
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
// By default the api returns the last or top 10 magnets
// Usage: localhost:9000/api/magnets/top/40      localhost:9000/api/magnets/latest/40
      // to get top/latest 40 magnets
router.get('/magnets/:list', function (req, res, next) {
  var start = parseInt(req.query.start) || 1,
      stop = parseInt(req.query.stop) || start + 10,
      list = req.params.list;
  if (['top', 'latest'].indexOf(list) === -1) {
    return next();
  }
  if (start > stop) {
    return res.send(400, {
      error: 'Start needs to be less than stop'
    });
  }
  if (stop - start > 100) {
    return res.send(400, {
      error: 'Maximum difference between stop and start is 100'
    });
  }
  magnets.readList(list, start, stop, function (err, magnets) {
    res.send(200, magnets);
  });
});

router.get('/magnets', function (req, res, next) {
  var query = req.query.query,
      start = parseInt(req.query.start) || 1,
      stop = parseInt(req.query.stop) || start + 10;
  if (start > stop) {
    return res.send(400, {
      error: 'Start needs to be less than stop'
    });
  }
  if (stop - start > 100) {
    return res.send(400, {
      error: 'Maximum difference between stop and start is 100'
    });
  }
  magnets.search(query, start, stop, function (err, magnets) {
    res.send(200, magnets);
  });
});

module.exports = exports = router;
