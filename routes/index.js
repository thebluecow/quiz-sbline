var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Quiz = require('../models/quiz');
var mid = require('../middleware');
var moment = require('moment');

// GET /profile
router.get('/profile', mid.requiresLogin, function(req, res, next) {
  User.findById(req.session.userId)
      .exec(function (error, user) {
        if (error) {
          return next(error);
        } else {
          return res.render('profile', { title: 'Profile', name: user.name });
        }
      });
});

// GET /profile
router.get('/quiz', mid.requiresLogin, function(req, res, next) {
  User.findById(req.session.userId)
      .exec(function (error, user) {
        if (error) {
          return next(error);
        } else {
          return res.render('quiz', { title: 'Quiz', name: user.name });
        }
      });
});

// GET /logout
router.get('/logout', function(req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function(err) {
      if(err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});

// GET /login
router.get('/login', mid.loggedOut, function(req, res, next) {
  return res.render('login', { title: 'Log In'});
});

// POST /login
router.post('/login', function(req, res, next) {
  if (req.body.email && req.body.password) {
    User.authenticate(req.body.email, req.body.password, function (error, user) {
      if (error || !user) {
        var err = new Error('Wrong email or password.');
        err.status = 401;
        return next(err);
      }  else {
        req.session.userId = user._id;
        return res.redirect('/quiz');
      }
    });
  } else {
    var err = new Error('Email and password are required.');
    err.status = 401;
    return next(err);
  }
});

// POST /game
router.post('/game', function(req, res, next) {
  if (req.body.totalQuestions &&
      req.body.answered &&
      req.body.correct &&
      req.body.incorrect) {

    var quizData = {
      user: req.session.userId,
      totalQuestions: req.body.totalQuestions,
      answered: req.body.answered,
      correct: req.body.correct,
      incorrect: req.body.incorrect
    }

    Quiz.create(quizData, function (error, user) {
        if (error) {
          return next(error);
        } else {
          req.session.userId = user._id;
          return; //res.redirect('/quiz',);
        }
      });

    } else {
      var err = new Error('All fields required.');
      err.status = 400;
      return next(err);
    }
});

// GET /profile
router.get('/report', mid.requiresLogin, function(req, res, next) {
  Quiz.find({
            'user': req.session.userId
        })
        .populate([{
            path: 'quiz',
            select: 'totalQuestions gameDate answered correct incorrect'
        }, {
            path: 'user',
            select: 'name'
        }])
        .exec(function(err, games) {
            if (err) {
                res.status(400);
                return next(err);
            }
            return res.render('report', { title: 'Previous Scores', name: req.session.userId, games: games, moment: moment });
        });
});

// GET /register
router.get('/register', mid.loggedOut, function(req, res, next) {
  return res.render('register', { title: 'Sign Up' });
});

// POST /register
router.post('/register', function(req, res, next) {
  if (req.body.email &&
    req.body.name &&
    req.body.password &&
    req.body.confirmPassword) {

      // confirm that user typed same password twice
      if (req.body.password !== req.body.confirmPassword) {
        var err = new Error('Passwords do not match.');
        err.status = 400;
        return next(err);
      }

      // create object with form input
      var userData = {
        email: req.body.email,
        name: req.body.name,
        password: req.body.password
      };

      // use schema's `create` method to insert document into Mongo
      User.create(userData, function (error, user) {
        if (error) {
          return next(error);
        } else {
          req.session.userId = user._id;
          return res.redirect('/quiz');
        }
      });

    } else {
      var err = new Error('All fields required.');
      err.status = 400;
      return next(err);
    }
})

// GET /
router.get('/', function(req, res, next) {
  return res.render('index', { title: 'Home' });
});

// GET /about
router.get('/about', function(req, res, next) {
  return res.render('about', { title: 'About' });
});

module.exports = router;