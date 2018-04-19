var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var routes = require('./routes/index');
var app = express();

var port = process.env.PORT || 3000;

// use sessions for tracking logins
app.use(session({
  secret: 'software portability is hard',
  resave: true,
  saveUninitialized: false
}));

// make user ID available in templates
app.use(function (req, res, next) {
  res.locals.currentUser = req.session.userId;
  next();
});

app.locals.sprintf = require("sprintf-js").sprintf;
app.locals.format = "%.2f";

// set mongodb database name
//const DB_NAME = 'quiz';
// for mongolab
const DB_NAME = 'heroku_kb1c62g0';

//mongoose.connect('mongodb://localhost:27017/' + DB_NAME);
mongoose.connect('mongodb://heroku_kb1c62g0:dksesevuud5h0dkul1dm1jap4o@ds147589.mlab.com:47589/' + DB_NAME);

var db = mongoose.connection;

db.once('open', function() {
    console.log('db connection successful');

    // adding drop database here to ensure unique index on email
    // is properly created
    /*db.dropDatabase(function(err, result) {
        console.log('db dropped');
    });*/

});
// mongo error
db.on('error', console.error.bind(console, 'connection error:'));

// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// serve static files from /public
app.use(express.static(__dirname + '/public'));

// view engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// include routes
app.use('/', routes);

//app.use(logger('dev'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// error handler
// define as the last app.use callback
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// listen on port 3000
app.listen(port, function () {
  console.log('Express app listening on port ' + port);
});