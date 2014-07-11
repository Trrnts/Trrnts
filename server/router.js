var express = require('express');

var router = express.Router();

// http://localhost:9000/api/magnets
router.post('/magnets', function (req, res) {
  res.send('Hello World!');
});

// http://localhost:9000/api/magnets/top
router.get('/magnets/top', function (req, res) {
  res.send('Hello World!');
});

// http://localhost:9000/api/magnets/latest
router.get('/magnets/latest', function (req, res) {
  res.send('Hello World!');
});

module.exports = router;
