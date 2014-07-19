var express = require('express'),
    magnets = require('./magnets');

var router = express.Router();

// Creates a new magnet. Accepts JSON-object having one attribute `magnetURI.`
// Usage:
// localhost:9000/api/magnets
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

// By default the API returns the last or top 10 magnets.
// Usage:
// localhost:9000/api/magnets/top?start=0&stop=3
// localhost:9000/api/magnets/latest
router.get('/magnets/:list', function (req, res, next) {
  var start = parseInt(req.query.start) || 0,
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

// Implements search for a specific torrent.
// Usage:
// localhost:9000/api/magnets?query=movie
router.get('/magnets', function (req, res, next) {
  var query = req.query.query,
      start = parseInt(req.query.start) || 0,
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
