var kue = require('kue'),
    redis = require('../redis');

var crawlJobQueue = module.exports = exports = kue.createQueue({
  redis: {
    createClientFactory: function () {
      return redis();
    }
  }
});

