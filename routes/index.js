'use strict'
/* ==============================================================
    Include required packages / Module Dependencies
=============================================================== */
var fs              = require('fs')
  , path            = require('path')
  , config          = require('../config')
  , utils           = require('../utils')
  , flash           = require('connect-flash')
  //, util            = require('util')   // I don't know what this is
  , passport        = require('passport')
  , LocalStrategy   = require('passport-local').Strategy
  , cradle          = require('cradle');

/* ===================================================
   Cradle connection to Cloudant
====================================================== */
var connection = new(cradle.Connection)(
  config.couchdb.url, 
  config.couchdb.port, 
  {
    auth:{
      username: config.couchdb.username, 
      password: config.couchdb.password
    },
    cache: true
  }
);

/* ===================================================
   Create the database if needed
====================================================== */
var db = connection.database('users');

db.exists(function (err, exists) {
  if (err) {
      console.log('Error1: ', err);
  } else if (exists) {
      console.log('Database exists, OK');
  } else {
      console.log('Database does not exist, creating it...');
      db.create(function (error) {
        if (error) {
            console.log('Could not create database: ', error);
        } else {
            console.log('Done! Created Database');
        }
        // ===================================================
        //   Define & add the design views
        //====================================================  
        var designdoc = {
          "views": {
            "byUserName": {
                "map": "function (doc) { if (doc.username) { emit(doc.username, doc) } }"
            },
            "byUserEmail": {
                "map": "function (doc) { if (doc.email) { emit(doc.email, doc) } }"
            },
            "all": {
                "map": "function (doc) { if (doc.name) { emit(doc.name, doc) } }"
            }
          }
        };

        db.save('_design/user', designdoc, function (err2, res) {
          if (err2) {
              // Handle error
              console.log('Cannot add Design Doc!', err2);
          } else {
              // Handle success
              console.log('Added Design Doc', res);
          }
        });

        //===================================================
        //   Save a test User
        //===================================================
        var testuser = {
            jsonType: 'user',
            username: 'Dan',
            password: utils.hash('passw0rd', 'Dan'),
            email: 'dan@awesomedomain.com',
            created_at: new Date(),
            updated_at: new Date()
        };

        // See if test user exists
        db.get(testuser.username, function (err, doc) {
          if (err) {
            // Handle error
            console.log('Test User does not exist\n');
            // Add the User
            db.save(testuser.username,   // Document Name
              testuser,                  // Document Contents (user above)
              function(error, result) {
                if(!error) {
                  console.log("Added Test User", result);
                } else {
                  console.log("Error: ", error);
                }
            });
          } else {
            // Handle success
            console.log('USER: ' + doc + '\n');
          }
        });
      });
  }
});

/* ===================================================
   Needed for Passport 
====================================================== */
function findById(id, fn) {
  db.get(id, function(error, result) {
    if (!error) {
      fn(null, result);
    } else {
      fn(new Error('User ' + id + ' does not exist'));
    }
  });
}

/* ===================================================
   Needed for Passport 
====================================================== */
function findByUsername(username, fn) {
  db.get(username, function(error, result) {
    if (!error) {
      return fn(null, result);
    } else {
      console.log('Error in findByUsername!', error);
      return fn(null, null);
    }
  });
}

/* ===================================================
   Added to support signup - Needed for Passport 
====================================================== */
function findByEmail(email, fn) {
  db.get(email, function(error, result) {
    if (!error) {
      return fn(null, result);
    } else {
      console.log('Error in findByEmail!', error);
      return fn(null, null);
    }
  });
}

/* ===================================================
   Needed for Passport 
====================================================== */
/*  Simple route middleware to ensure user is authenticated.
 *  Use this route middleware on any resource that needs to 
 *  be protected.  If the request is authenticated (typically 
 *  via a persistent login session), the request will proceed.
 *  Otherwise, the user will be redirected to the login page. 
 */                 
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

/* ===================================================
   Needed for Passport 
====================================================== */
/*   Passport session setup.
 *   To support persistent login sessions, Passport needs to be able to
 *   serialize users into and deserialize users out of the session.  Typically,
 *   this will be as simple as storing the user ID when serializing, and finding
 *   the user by ID when deserializing.  
 */
passport.serializeUser(function(user, done) {
  done(null, user.id); 
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});

/* ===================================================
   Needed for Passport 
====================================================== */
// Use the LocalStrategy within Passport.
// Strategies in passport require a `verify` function, 
// which accept credentials (in this case, a username and 
// password), and invoke a callback with a user object.  
passport.use(new LocalStrategy(function(username, password, done) {
    
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { 
          return done(null, false, { message: '<strong>Oh Snap!</strong> We do not recognize your username ' + username + '.'}); 
        }
        if (user.password != utils.hash(password, user.username)) { 
          return done(null, false, { message: '<strong>Oh Snap!</strong> Your password does not match.' }); 
        }
        return done(null, user);
      });
    });
  }
));

/* ==============================================================
    Here's all the routing
=============================================================== */
module.exports = function(app) {

  // --- GET Routes
  app.get('/', index);
  app.get('/account', ensureAuthenticated, account);
  app.get('/signup', signup);
  app.get('/login', login);
  app.get('/logout', logout);
  app.get('/welcome', welcome);
  
  // -- POST Routes
  app.post('/register', register);
  app.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), postlogin);

  // --- Error Routes (always last!)
  app.get('/404', fourofour);
  app.get('/403', fourothree);
  app.get('/500', fivehundred);

};

/* ==============================================================
    Here's route code (the rendering function is placed in a 
    variable andcalled in the routing above)
=============================================================== */

//GET / (index)
///////////////////////////////////////////////////////////////
var index = function(req, res){
  res.render('index', {
    user: req.user
  });
};

//GET /welcome
///////////////////////////////////////////////////////////////
var welcome = function(req, res){
  res.render('welcome', {
    user: req.user
  });
};

//GET /signup
///////////////////////////////////////////////////////////////
var signup = function(req, res){
  res.render('signup', {
    user: req.user,
    message: req.flash('error')
  });
};

//GET /account
//////////////////////////////////////////////////////////////
var account = function(req, res){
  res.render('account', { 
    user: req.user 
  });
};

//GET /login
//////////////////////////////////////////////////////////////
var login =function(req, res){
  res.render('login', { 
    user: req.user, 
    message: req.flash('error') 
  });
};

//GET /logout
///////////////////////////////
var logout = function(req, res){
  req.logout();
  res.redirect('/');
};

///GET /404
///////////////////////////////
var fourofour = function(req, res, next){
  // trigger a 404 since no other middleware
  // will match /404 after this one, and we're not
  // responding here
  next();
}

///GET /403
///////////////////////////////
var fourothree = function(req, res, next){
  // trigger a 403 error
  var err = new Error('not allowed!');
  err.status = 403;
  next(err);
}

///GET /500
///////////////////////////////
var fivehundred = function(req, res, next){
  // trigger a generic (500) error
  next(new Error('keyboard cat!'));
}

//POST /signup
///////////////////////////////////////////////////////////////
var register = function(req, res) {
/* ==============================================================
    This needs work.  We need to be sure we are not saving 
    duplicate users and user email addresses.  In theory we
    want a single user name/email combination.  We need a way
    to pass back the error to the user also if they are
    trying to create a duplicate account.  

    The form values are passed in via req.body
=============================================================== */

  var userdoc = {
    jsonType: 'user',
    username: req.body.username,
    password: utils.hash(req.body.password, req.body.username),
    email: req.body.email,
    created_at: new Date(),
    updated_at: new Date()
  };

  // --- Check if the user exists
  db.get(userdoc.username, function (err, result) {
    if (!err) {
      // Found User!
      console.log('Found user' + result);
      req.flash('error', '<strong>Oh Snap!</strong> We already have a user by that name.');
      res.redirect('/signup');
      //res.render('/signup', null, { message: 'User already exists!' });
    } else {
      // didn't find user
      console.log('did not find user' + err);
      // User does not yet exist
      // now check if the email exists
      db.view('user/byUserEmail', { key: userdoc.email }, function (errs, doc) {
        if (!errs) {
          // check the return value
          if (0 === doc.length) {
            // didn't return anything
            console.log('did not find email' + doc);
            db.save(userdoc.username, userdoc, function(err, result) {
              if(!err) {
                console.log('Saved new user: success! ' + result);
                // calling req.login below will make passportjs setup 
                // the user object, serialize the user, etc.
                // This has to be placed here *after* the database save 
                // because the result gives us an object with an .id 
                req.login(result, {}, function(err) {
                  if (err) { 
                    console.log('Passport login did not work!', err); 
                  } else {
                    res.redirect("/welcome");
                  }
                });
              } else {
                result.send(error.status_code);
              }
            });
          } else {
            // Found email!
            console.log('Found email' + doc);
            req.flash('error', '<strong>Oh Snap!</strong> Sorry, We already have someone with that email address.');
            res.redirect('/signup');           
          }
        } else {
          console.log('Error: ' + err);
        }
      });
    }
  });
}

// POST /login
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called.
//
//   curl -v -d "username=Dan&password=passw0rd" http://127.0.0.1:3000/login
//
//POST Login
///////////////////////////////
var postlogin = function(req, res) {
    res.redirect('/account');
};