'use strict';

var mongoose = require('mongoose');
var User = require('./user');
var Schema = mongoose.Schema;

var QuizSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  /*user: {
    type: String,
    required: true
  },*/
  gameDate: { type: Date, default: Date.now },
  totalQuestions: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 1000
  },
  answered: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 1000
  },
  correct: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 1000
  },
  incorrect: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 1000
  }
});

var Quiz = mongoose.model('Quiz', QuizSchema);
module.exports = Quiz;