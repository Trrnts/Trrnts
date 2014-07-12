var express = require('express'),
    app = express(),
    routers = {
      '/api': require('../router')
    };

require('./config.js')(app, express, routers);

module.exports = exports = app;
