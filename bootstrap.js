// This script is being used for inserting some sample data to play with.
// Usage: `node bootstrap.js`. Torrents are being scraped from TPB.

var request = require('request'),
    _ = require('lodash'),
    port = process.env.PORT || 9000;

console.log('Started bootstrapping script. This may take a while.');

// 100: Audio
// 200: Video
// 300: Applications
// 400: Games
// 500: Porn
// 600: Other
var categories = [100, 200, 300, 400, 500, 600];

// categoryCode: One of the categories specified above.
// page: Page, starts with 0
// order: 7 (Seeders) or 9 (Leechers) (descending)
var createURL = function (categoryCode, page, order) {
  return 'http://thepiratebay.se/browse/' + categoryCode + '/' + page + '/' + order;
};

var extractMagnetURIs = function (body) {
  var parsed = body.match(/\"magnet:\?\S+\"/g),
      attr;

  return _.map(parsed, function (magnetURI) {
    attr = magnetURI.split('');
    attr.pop(); // remove first "
    attr.shift(); // remove last "
    return attr.join('');
  });
};

// Total number of open requests.
var outstanding = 0;

var onResponse = function (err, resp, body) {
  console.log('Received response.');
  console.log(--outstanding + ' requests still left.');
  if (err) {
    return console.log('Error scraping ' + resp);
  }
  _.each(extractMagnetURIs(body), function (magnetURI) {
    // Insert magnet URI.
    request.post('http://localhost:' + port + '/api/magnets', {
      json: {
        'magnetURI': magnetURI
      }
    }, function (err, resp, body) {
      if (err) {
        return console.log('Error inserting ' + resp);
      }
    });
  });
};

// Scrape the first page of each category. Ordered by leechers (descending).
var url;
_.each(categories, function (categoryCode) {
  _.each(_.range(0, 5), function (page) {
    url = createURL(categoryCode, page, 7);
    console.log('Requesting ' + url + '...');
    outstanding++;
    request(url, onResponse);

    url = createURL(categoryCode, page, 9);
    console.log('Requesting ' + url + '...');
    outstanding++;
    request(url, onResponse);
  });
});
