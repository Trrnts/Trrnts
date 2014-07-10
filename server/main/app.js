"use strict";

var express = require('express');
var app = express();
var routers = {};

require('./config.js')(app, express, routers);


module.exports = exports = app;
