var crawl = require('./crawl');

crawl.init(function () {
  crawl('8CA378DBC8F62E04DF4A4A0114B66018666C17CD', function (err, results) {
    console.log(results);
    process.exit(1);
  });
});
