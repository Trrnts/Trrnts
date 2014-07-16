// Port, host and auth token of Redis server might be defined as environment
// variables. If not, fall back to defaults.
var redisPort = process.env.REDIS_PORT || 6379,
    redisHost = process.env.REDIS_HOST || '127.0.0.1',
    redisAuth = process.env.REDIS_AUTH || null,
    redis = require('redis');

// Since we are waiting for the error event, we don't have to check for errors
// individually after each Redis command.
var onError = function (error) {
  console.error('Error in Redis client: ' + error.message);
  console.error(error.stack);
  console.log('Exiting now because of error in Redis client');
  // Our app doesn't work without DB. Exit.
  process.exit(1);
};

var onConnect =  function () {
  console.log('Successfully connected to Redis ' + redisHost + ':' + redisPort);
};

// How to use this module:
// var redis = require('./redis');
// redis.set('key', 'value');
// redis.get('key', function (err, value) {
//   console.log('Value: ' + value);
// });
//
// See http://redis.io/commands for available commands and
// https://github.com/mranney/node_redis for basic usage.

module.exports = exports = (function () {
  // Create a new client and establish a connection to DB.
  // We need to create a new Redis client every time we require this file since
  // Redis clients can either be in subscriber or regular mode. Subscriber mode
  // means only commands invloving basic pub-sub functionality are valid.
  var redisClient = redis.createClient(redisPort, redisHost, {
    auth_pass: redisAuth
  });
  redisClient.on('error', onError);
  redisClient.on('connect', onConnect);
  return redisClient;
});
