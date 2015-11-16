// ---[ BASIC SETUP ]---

var express = require('express');
var app = express();
var mongoose = require('mongoose');
var logger = require('./lib/logger').getLogger({'module': 'server'});

//var path = require('path');
//var favicon = require('serve-favicon');
//var logger = require('morgan');
//var cookieParser = require('cookie-parser');

// import required modules
var bodyParser = require('body-parser');

//import routes and configuration
var dbConf = require('./db');
var routes = require('./routes/index');

// ---[ SETUP MIDDLEWARE ]---
app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  var pw = req.body.password;
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  logger.info('Received ' + req.method + ' request from ' + ip + ' to '+ fullUrl + '. Password: ' + pw);
  next();
});

//Setup port for the app
var port = process.env.PORT || 3000;

app.all('/*', function (req, res, next) {
  // CORS headers
  res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  // Set custom headers for CORS
  //res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, x-session, x-key');
  if (req.method == 'OPTIONS') {
    res.status(200).end();
  } else {
    next();
  }
});

// ---[ MONGODB SETUP ]---
//Temporarily MongoLab is used

mongoose.connect(dbConf.url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function () {
  console.log('Connected to MongoDB: ' + dbConf.url);
});

// ---[ REGISTER ROUTES ]---

//app.use('/users', users);

app.use('/api', express.static(__dirname + '/docs'));

app.all('/api/*', [require('./lib/RequestValidator.js')]);

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// ---[ ERROR HANDLERS ]---

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send('error', {
    message: err.message,
    error: {}
  });
});

app.listen(port);

console.log('Server listening on port: ' + port);
