var app = require('./server/main/app.js'),
    port = process.env.PORT || app.get('port'),
    successLog = 'Listening on ' + app.get('base url') + ':' + port;

require('kue').app.listen(3000);

app.listen(port, function () {
  console.log(successLog);
});
