angular.module('trrntsApp.filters', [])

.filter('agoFilter', function () {
  return function (timestamp) {
    timestamp = parseInt(timestamp);
    return moment(timestamp).fromNow();
  };
});
