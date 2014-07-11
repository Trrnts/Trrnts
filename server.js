"use strict";

var app   = require('./server/main/app.js'),
    port  = process.env.PORT || app.get('port'),
    log   = 'Listening on ' + app.get('base url') + ':' + port;

app.listen(port);
console.log(log);
