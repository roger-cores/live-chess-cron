var express = require('express');
var router = express.Router();

module.exports.registerRoutes = function(models, codes){


  router.get('/', function(req, res, next){
    models.Category.find({}).exec(function(err, categories){
      if(err) {
        next(err);
        return;
      }
      res.status(codes.OK).send(categories);
    });
  });

  return router;
}
