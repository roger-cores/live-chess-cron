var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var nodeUtils = require('util');
var app = express();
var codes = require('./codes.json');
var cron = require('node-cron');
var firebase = require("firebase");
var http = require('http');
var config = {
    apiKey: "AIzaSyAQJaibXA510_Vb4qaDiXl8Me7fT5_9I_c",
    authDomain: "ics-live.firebaseapp.com",
    databaseURL: "https://ics-live.firebaseio.com",
    storageBucket: "ics-live.appspot.com",
    messagingSenderId: "573085776272"
  };
firebase.initializeApp(config);
var database = firebase.database();
var masterData = '/tournaments';

var userEmail = "rogercores2@gmail.com";
var userPassword = "password12345678910";

firebase.auth().signInWithEmailAndPassword(userEmail, userPassword).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  console.log(errorCode + ": " + errorMessage);
});


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));


app.get('/', function(req, res, next){
  database.ref(masterData).once('value').then(function(snapshot) {
    for(var tournamentKey in snapshot.val()){
      var tournament = snapshot.val()[tournamentKey];
      for(var roundKey in tournament.rounds){
        var round = tournament.rounds[roundKey];
        if(round.publish === true){
          var pgnUrl = tournament.base_url + '/' + tournament.tournamentAddress + '/' + round.roundAddress + '/games.pgn';
          console.log(pgnUrl);
          updatePgn(tournamentKey, roundKey, pgnUrl);


        } else continue;

      }


    }
  });
  res.json({msg: "updated"});
});






// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    console.log(err);
    res.status(err.status || 500).send({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var parsePgn = function(pgn){
  while(pgn.includes('{')){
    var open = pgn.indexOf('{');
    var close = pgn.indexOf('}');
    var result = pgn.split('');
    pgn = pgn.replace(pgn.substring(open, close+1), "");
    //console.log(pgn);
  }
  return pgn;
}

var updatePgn = function(tournamentKey, roundKey, pgnUrl){
  http.get(pgnUrl, function(response) {
      // Continuously update stream with data
      var body = '';
      response.on('data', function(d) {
          body += d;
      });
      response.on('end', function() {
          // while(body.includes('{'))
          //     body = body.replace(/{.*}/, '');

          body = parsePgn(body);
          firebase.database().ref(masterData + '/' + tournamentKey + '/rounds/' + roundKey + '/' + 'pgn').set(body);
          console.log("update done");
      });
  });
}




cron.schedule('* * * * *', function(){
  console.log('uploading the data at ' + Date.now());
  database.ref(masterData).once('value').then(function(snapshot) {
    for(var tournamentKey in snapshot.val()){
      var tournament = snapshot.val()[tournamentKey];
      for(var roundKey in tournament.rounds){
        var round = tournament.rounds[roundKey];
        if(round.publish === true){
          var pgnUrl = tournament.base_url + '/' + tournament.tournamentAddress + '/' + round.roundAddress + '/games.pgn';
          console.log(pgnUrl);
          updatePgn(tournamentKey, roundKey, pgnUrl);


        } else continue;

      }


    }
  });


});





module.exports = app;
