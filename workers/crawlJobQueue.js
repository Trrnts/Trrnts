var kue = require('kue'),
    redis = require('../redis');

var crawlJobQueue = module.exports = exports = kue.createQueue({
  redis: {
    createClientFactory: function () {
      return redis();
    }
  }
});

process.once('SIGTERM', function (sig) {
  queue.shutdown(function (err) {
    console.log('Kue is shut down.', err || '');
    process.exit(0);
  }, 5000);
});
