var express = require('express'),
    magnets = require('./magnets'),
    locations = require('./locations'),
    _ = require('lodash');

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

// Returns a magnet including comments.
// Usage:
// localhost:9000/api/magnets/nrieferofor
router.get('/magnets/:infoHash', function (req, res, next) {
  var infoHash = req.params.infoHash;

  magnets.readMagnet(infoHash, function (err, magnet) {
    if (err) {
      return next();
    }
    magnet.comments = _.map(magnet.comments || [], function (comment) {
      delete comment.ip;
      return comment;
    });
    res.send(200, magnet);
  });
});

// Adds a comment. Accepts a JSON object.
// Usage:
// localhost:9000/api/magnets/nrieferofor
router.post('/magnets/:infoHash', function (req, res) {
  if (!req.body.text) {
    return res.send(400, {
      error: 'No text provided'
    });
  }
  if (req.body.length > 500) {
    return res.send(400, {
      error: 'Comment too long - 500 chars max'
    });
  }
  var infoHash = req.params.infoHash,
      ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  magnets.commentMagnet(infoHash, ip, req.body.text, function (err) {
    if (err) {
      return res.send(400, {
        error: err.message
      });
    }
    res.send(201);
  });
});

// Implements search for a specific torrent.
// Usage:
// localhost:9000/api/magnets?query=movie
router.get('/magnets', function (req, res, next) {
  var query = req.query.query,
      start = parseInt(req.query.start) || 0,
      stop = parseInt(req.query.stop) || start + 10;
  if (!query) {
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
  magnets.search(query, start, stop, function (err, magnets) {
    res.send(200, magnets);
  });
});

router.get('/locations', function (req, res, next) {
  var type = req.query.query;
  var number = req.query.number || -1; // if amount not specified, return everything
  if (['LatAndLong', 'Country', 'Region', 'City'].indexOf(type) === -1) {
    return next();
  }

  locations['getBy' + type](number, function (err, results) {
    if (err) {
      return next();
    }

    results = results || {};
    res.send(200, results);
  });
});

module.exports = exports = router;
