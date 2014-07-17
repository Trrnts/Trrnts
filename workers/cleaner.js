var queue = require('./queue'),
    kue = require('kue');

// Remove completed jobs from DB.
queue.on('job complete', function (id, result) {
  kue.Job.get(id, function (err, job) {
    if (err) return;
    job.remove(function (err) {
      if (err) throw err;
      console.log('removed completed job #%d', job.id);
    });
  });
});
