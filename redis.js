// Port and Host of Redis server might be defined as environment variables. If
// not, fall back to defaults.
var redisPort = process.env.REDIS_PORT || 6379,
    redisHost = process.env.REDIS_HOST || '127.0.0.1',
    redisAuth = process.env.REDIS_AUTH || null;

// Create a new client and establish a connection to DB.
var redis = require('redis').createClient(redisPort, redisHost, {
  auth_pass: redisAuth
});

redis.on('error', function (error) {
  console.error('Error in Redis client: ' + error.message);
  console.log('Exiting now because of error in Redis client');
  process.exit(1);
});

redis.on('connect', function () {
  console.log('Successfully connected to Redis ' + redisHost + ':' + redisPort);
});

// How to use this module:
// var redis = require('./redis');
// redis.set('key', 'value');
// redis.get('key', function (err, value) {
//   console.log('Value: ' + value);
// });
//
// See http://redis.io/commands for available commands and
// https://github.com/mranney/node_redis for basic usage.

module.exports = exports = redis;
