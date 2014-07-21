var bodyParser = require('body-parser'),
    middle = require('./middleware');

module.exports = exports = function (app, express, routers) {
  app.set('port', process.env.PORT || 9000);
  app.set('base url', process.env.URL || 'http://localhost');
  app.use(bodyParser.json());
  app.use(express.static(__dirname + '/../../client'));
  app.use(middle.logError);
  app.use(middle.handleError);
  for (var path in routers) {
    app.use(path, routers[path]);
  }
};
