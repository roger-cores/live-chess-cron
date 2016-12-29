var express = require('express');
var mv = require('mv');
var recipeRoute = require('./users/recipe');
var dataRoute = require('./users/data');
var categoryRoute = require('./users/category');
var login = require('connect-ensure-login');
var router = express.Router();
var crypto = require('crypto');
mailer = require('express-mailer');
var uuid = require('node-uuid');


module.exports.registerRoutes = function(models, passport, multiparty, utils, oauth, codes) {

		//change password DONE
		//upload image DONE
		//follow/unfollow DONE
		//get count following/followers DONE

    //search by nickname DONE
    //search by email DONE

    var preAuthenticate = function(req, res, next){
      if(req.session.access_token)
        var tokenHash = crypto.createHash('sha1').update(req.session.access_token).digest('hex');
      else {res.status(codes.UNAUTHORIZED).send({message: 'Unauthorized'}); return;}
      models.Token.findOne({name: tokenHash}, function(err, token){
          if(err) next(err);
          else if(!token){res.status(codes.UNAUTHORIZED).send({message: 'Unauthorized'})}

          else if(token.expirationDate < Date.now()) res.status(codes.UNAUTHORIZED).send({message: 'Unauthorized'})
          else {

              req.body.access_token = req.session.access_token;

              models.ID.findOne({email: token.userId}, function(err, user){
                  if(err) next(err);
                  else if(!user) res.status(codes.UNAUTHORIZED).send({message: 'Unauthorized'})
                  else {
                    req.body.user_id = user._id;
                    next();
                  }
              });
          };
      });
    }

    router.post('/forgot-pass/:email', function(req, res, next){
      models.ID.findOne({email: req.params.email}, function(err, user){
        if(err) next(err);
        else if(!user) res.status(codes.NOT_FOUND).send({error: "This email doesn't exist!"});
        else {

          var uuidx = uuid.v4();
          user.code = user.generateHash(uuidx);
          console.log(user.code);
          user.save(function(err, user){
            if(err) next(err);
            else if(!user){res.status(codes.SERVER_ERROR).send({error: "server error"})}
            else {
              res.mailer.send('email', {
                to: user.email, // REQUIRED. This can be a comma delimited string just like a normal email to field.
                subject: 'Account Recovery', // REQUIRED.
                email: user.email,
                code: user.code,
                changePassLink: "http://192.168.0.106:3000/change-pass/" + encodeURIComponent(user.email) + "/" + encodeURIComponent(user.code),
                didntRequestLink: "http://192.168.0.106:3000/security"
                //otherProperty: 'Other Property' // All additional properties are also passed to the template as local variables.
              }, function (err) {
                if (err) {
                  // handle error
                  console.log(err);
                  res.send({error: 'error sending email'});
                  return;
                }
                res.send('Email Sent');
              });
            }
          });


        }
      });
    });

    router.post('/validate-token', passport.authenticate('clientPassword', {failWithError: true}) , function(req, res, next){

        console.log(req.body);

        var tokenHash = crypto.createHash('sha1').update(req.body.access_token).digest('hex');

        models.Token.findOne({name: tokenHash}, function(err, token){
            if(err) next(err);
            else if(!token){res.status(codes.UNAUTHORIZED).send({error: 'Invalid or Expired Token', code: -1})}

            else if(token.expirationDate < Date.now()) res.status(codes.UNAUTHORIZED).send({error: 'Expired Token', code: -2});
            else {
              req.session.access_token = req.body.access_token;
              res.status(codes.OK).send({code: 1})

            };
        });
    }, function(err, req, res, next){
      next({error: "" + err, code: -3});
    });

    router.post('/oauth/token', function(req, res, next){
      console.log(req.body);
      next();
    }, oauth.token, function(err, req, res, next){
      console.log(err);
      if(err.error){
        if(err.error_description.equals("Invalid refresh token")){
          err.code = -1;
          res.status(codes.UNAUTHORIZED).send(err);
        }
        else if(err.error_description.equals("Unauthorized")){
          err.code = -2;
          res.status(codes.UNAUTHORIZED).send(err);
        }
        else if(err.error.equals("unsupported_grant_type")){
          err.code = -3;
          res.status(codes.BAD_REQUEST).send(err);
        }
      } else {
        err.code = 0;
        next(err);
      }
    });


    router.use('/recipe',
      preAuthenticate,
      passport.authenticate('accessToken', {session: false}),
      recipeRoute.registerRoutes(models, multiparty, utils, codes)
    );

    router.use('/data',
      preAuthenticate,
      passport.authenticate('accessToken', {session: false}),
      dataRoute.registerRoutes(models, codes)
    );

    router.use('/category',
      preAuthenticate,
      passport.authenticate('accessToken', {session: false}),
      categoryRoute.registerRoutes(models, codes)
    );

    router.get('/logout', function(req, res) {
        req.logout();
        req.session.access_token = null;
        res.status(codes.OK).send({code: 1});
    });

    router.post('/signup',
     passport.authenticate('clientPassword', {failWithError: true}),
     function(req, res, next){
    	passport.authenticate('local-signup', function(err, user, info){


    		if(err) {
          if(err.code === 11000) {
            next('nickname exists');
          } else next(err);
        }
    		else if(!user){next({code: 0, error: 'signup failed'});}
        else {
          res.status(codes.CREATED).send({_id: user._id, __v: user.__v})
        }

    	})(req, res, next);
    }, function(err, req, res, next){
      console.log(err);
      next(err);
    });


    router.get('/nickname/:nickname',
      function(req, res, next){
          models.ID.findOne({nickname: req.params.nickname}, function(err, user){
            if(err) {next(err)}
            else if(!user){res.status(codes.OK).send({code: 1});}
            else res.status(codes.OK).send({code: 0});
          });
      }
    );

    router.get('/email/:email',
      function(req, res, next){
          models.ID.findOne({email: req.params.email}, function(err, user){
            if(err) {next(err)}
            else if(!user){res.status(codes.OK).send({code: 1});}
            else res.status(codes.OK).send({code: 0});
          });
      }
    );

    router.put('/changepass/:email/:code', function(req, res, next){
      models.ID.findOne({email: req.params.email}, function(err, user){
        if(err) next(err);
        else if(!user) {res.status(codes.NOT_FOUND).send({message: 'User Doesn\'t Exist'})}
        else {
          if(!user.validCode("asdf")) {
            console.log(req.body);
            user.password = user.generateHash(req.body.user.newpassword);
            user.save(function(err, user){
    					if(err) next(err);
    					else {
                user.code = null;
                user.save(function(err, user){
                  if(err) next(err);
                  if(!user) {res.status(codes.SERVER_ERROR).send({message: 'server error'})}
                  res.status(codes.CREATED).send({code: 1, id: user._id});
                });

              }
    				});
          }
          else {
            res.status(codes.SERVER_ERROR).send({message: 'Code is invalid'});
          }
        }
      });
    });

		router.put('/change-pass',
      passport.authenticate('clientPassword', {session: false}),
      function(req, res, next){
			passport.authenticate('local-login', function(err, user, info){
				if(err) {next(err); return;}
				if(!user) {res.status(codes.UNAUTHORIZED).send({message: 'Unauthorized'}); return;};
				if(req.body.newpassword)
				user.password = user.generateHash(req.body.newpassword);
				user.save(function(err){
					if(err) next(err);
					else res.status(codes.CREATED).send({code: 1, id: user._id});
				});
			})(req, res, next);
		});

		router.post('/img',
        preAuthenticate,
        passport.authenticate('accessToken', {session: false}),

        function(req, res, next){
				var form = new multiparty.Form();

				form.parse(req, function(err, fields, files){
					if(err){
						next(err);
						return;
					} else if(!files.avatar){
            next({message: 'No file selected'});
            return;
          }

					mv(files.avatar[0].path,'./public/images/' + req.body.user_id, function(err){
						if(err){
							next(err);
							return;
						}

						res.status(codes.CREATED).send({code: 1});
					});
				});
		});

		router.put('/toggle-follow/:other_id',
        preAuthenticate,
        passport.authenticate('accessToken', {session: false}),

        function(req, res, next){
				var followers = false;
				models.ID.findOne({_id: req.params.other_id}, function(err, user){
					if(err){
						next(err);
						return;
					}

					if(!user){
						next(res.status(codes.NOT_FOUND).send({message: 'doesn\'t exist'}));
						return;
					}
					console.log(utils.contains(user.followers, req.body.user_id));
					if(utils.contains(user.followers, req.body.user_id)){
						utils.remove(user.followers, req.body.user_id);
						followers = false;
					} else {
						user.followers.push(req.body.user_id);
						followers = true;
					}



					user.save(function(err){
						if(err){
							next(err);
							return;
						}

						res.status(codes.CREATED).send({code: 1, followers: followers});
					});
				});
		});

		router.get('/:id/count-following',
        preAuthenticate,
        passport.authenticate('accessToken', {session: false}),


        function(req, res, next){
				models.ID.count({followers: req.params.id}, function(err, count){
						if(err) {
							next(err);
							return;
						}

						res.status(codes.OK).send({code: 1, following: count});
				});
		});

		router.get('/:id/count-followers',
      preAuthenticate,
      passport.authenticate('accessToken', {session: false}),


      function(req, res, next){
			models.ID.findOne({_id: req.params.id}, function(err, user){
				if(err){
					next(err);
					return;
				}

				res.status(codes.OK).send({code: 1, followers: user.followers.length})
			});
		});




	return router;
}

module.exports.isLoggedIn = function(req, res, next){
	if(req.isAuthenticated())
		return next();
	res.redirect('/');
}
