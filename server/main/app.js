"use strict";

var express = require('express');
var app = express();
var routers = {
  '/api': require('../router')
};

require('./config.js')(app, express, routers);


module.exports = exports = app;
