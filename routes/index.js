var express = require('express');
var router = express.Router();

router.get('/security', function(req, res, next){
  res.render('security');
});

router.get('/change-pass/:email/:code', function(req, res, next){
  res.render('index', {email: req.params.email, code: req.params.code});
});

router.get('/forgot-pass', function(req, res, next){
  res.render('forgot-pass', {});
});

router.get('/change-pass', function(req, res, next){
  res.render('change-pass');
});

module.exports = router;
