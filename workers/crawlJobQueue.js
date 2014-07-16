var kue = require('kue'),
    redis = require('../redis');

kue.app.listen(3000);

var crawlJobQueue = module.exports = exports = kue.createQueue({
  redis: {
    createClientFactory: function () {
      return redis();
    }
  }
});

