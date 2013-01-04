'use strict'
/* ==============================================================
    Include required packages / Module Dependencies
=============================================================== */
var fs              = require('fs')              // http://nodejs.org/docs/v0.3.1/api/fs.html
  , path            = require('path')            // http://nodejs.org/docs/v0.3.1/api/path.html
  , config          = require('../config')
  , utils           = require('../utils')
  , flash           = require('connect-flash')   // https://npmjs.org/package/connect-flash 
  //, util            = require('util')          // http://nodejs.org/docs/v0.3.1/api/util.html
  , passport        = require('passport')        // https://npmjs.org/package/passport
  , LocalStrategy   = require('passport-local').Strategy
  , pass            = require('pwd')             // https://github.com/visionmedia/node-pwd
  , cradle          = require('cradle');         ///https://npmjs.org/package/cradle

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
        hash: '',
        salt: '',
        email: 'dan@somedomain.com',
        created_at: new Date(),
        updated_at: new Date()
      };

      // See if test user exists
      db.get(testuser.username, function (err, doc) {
        if (err) {
          // Handle error
          console.log('Test User does not exist!\n');
          
          // Add the User (password is hardcoded as "passw0rd")
          pass.hash('passw0rd', function(err, salt, hash){
            
            if (err) throw err;
            
            // store the salt & hash in the DB
            testuser.hash = hash;
            testuser.salt = salt;

            db.save(testuser.username,   // Document Name
            testuser,                    // Document Contents (user above)
            function(error, result) {
              if(!error) {
                console.log("Added Test User" + result + '\n');
              } else {
                console.log("Error: " + error + '\n');
              }
            });

          })
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
// Doesn't need to query via a view, can just get doc
// by id directly
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
   Needed for Passport //TODO query by view
====================================================== */
function findByUsername(username, fn) {

  /*
  db.view('user/byUserName', {key: username}, function (error, result) { 
    if (error) {
      //fn(new Error('User ' + username + ' does not exist'));
    }
    else {
        if (result.length != 1) {
          //fn(new Error('User ' + username + ' does not exist'));
        }
        else {
          var user = result[0].value);
          console.log('Found user: ' + user);
          fn(null, user);                    
        }
    }          
  });
  
  
  db.view('user/byUserName', { key: username }, function (error, result) {
    if (!error) {
      // check the return value
      if (0 === result.length) {
        // didn't return anything
        return fn(null, null);
      } else {
        // found user!
        //console.log('Found user: ' + result);
        //console.log('Found user: ' + JSON.stringify(result[0]));

        // You have to parse the JSON!!!  This is what it looks like:
        /*
        [
          {
            "id":"Dan",
            "key":"Dan",
            "value":{
              "_id":"Dan",
              "_rev":"1-c81f0f740e80702de031a13b50ec6f21",
              "jsonType":"user",
              "username":"Dan",
              "hash":"ù7I\u001e?ß(^E¢jär?ë\u000f?.*¡N§bVt±·'??E\u001dWw\u001aÉ\u0010\u001f >L\tAâkºr\u0018/\u0016ôx2X¡,°ÿ\u001f-óIOçúUb ??pF\u000fqzS\u0012Fû09?íEV?I\u0015é\u0000\u0015â'F(\u001eì\u0012?k'zT?1UÆ0{?°\u0011?b?¿?\u001e\u001aßJ°Oz?2?ª",
              "salt":"e/0YT1+tXJe9fX3yB8AfQgFf+imyI/P2upXfjUOZcshGhiKsZMBPnleSXVPOyWac0lSRmLVpGS8FfMfvr4zDp2mguNgcSV3l/POrHU4mcy73V1xD1NFfXIwMW5LLXP0hVBTX549Nkm3lBjPECCtyBKdA5TYplTbskO9TYwZAKJk=",
              "email":"dan@somedomain.com",
              "created_at":"2013-01-03T06:02:44.800Z",
              "updated_at":"2013-01-03T06:02:44.800Z"
            }
          }
        ]
        
        //here's where you return the "value" from above: 
        var user = result[0].value;
        
        console.log('Found user: ' + user);

        return fn(null, user);
      }
    } else {
      // Error
      return fn(null, null);
    }
  });
  
*/
  
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
   Added to support signup - TODO Needed for Passport ?  Use in the signup?
====================================================== */
function findByEmail(email, fn) {
  db.view('user/byUserEmail', { key: email }, function (error, result) {
    if (!error) {
      // check the return value
      if (0 === result.length) {
        // didn't return anything
        return fn(null, null);
      } else {
        // found user!
        return fn(null, result);
      }
    } else {
      // Error
      return fn(null, null);
    }
  });

  /*
  db.get(email, function(error, result) {
    if (!error) {
      return fn(null, result);
    } else {
      console.log('Error in findByEmail!', error);
      return fn(null, null);
    }
  });
  */

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
          
          // If no user found
          return done(null, false, { message: '<strong>Oh Snap!</strong> We do not recognize your username ' + username + '.'}); 
        
        } else {
          
          // else check password
          pass.hash(password, user.salt, function(err, hash){
            
            if (err) { return done(err); }
            
            if (user.hash == hash) {
              // matches
              return done(null, user);
            } else {
              // doesn't match
              return done(null, false, { message: '<strong>Oh Snap!</strong> Your password does not match.' }); 
            }

          });
        }
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
  var err = new Error('Not Allowed!');
  err.status = 403;

  // respond with html page
  if (req.accepts('html')) {
    res.render('403', { 
      err: err,
      //url: req.url 
    });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not Allowed!' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not Allowed!');

  next(err);
}

///GET /500
///////////////////////////////
var fivehundred = function(req, res, next){
  // trigger a generic (500) error
  next(new Error('Testing 1,2,3!'));
}

//POST /signup
///////////////////////////////////////////////////////////////
var register = function(req, res) {

  // Check if the user exists
  db.get(req.body.username, function (err, result) {
    if (!err) {
      
      // Found User!
      console.log('Found user:' + result);
      req.flash('error', '<strong>Oh Snap!</strong> We already have a user by that name.');
      res.redirect('/signup');

    } else {
      
      // didn't find user
      console.log('Did not find user' + err);
      // User does not yet exist
      // now check if the email exists
      db.view('user/byUserEmail', { key: req.body.email }, function (errs, doc) {
        if (!errs) {
          // check the return value
          if (0 === doc.length) {
            // didn't return anything
            console.log('did not find email' + doc);


            // Add the User (password is hardcoded as "passw0rd")
            pass.hash(req.body.password, function (err, salt, hash) {
              
              if (err) throw err;
              
              // store the salt & hash in the DB
              var userdoc = {
                jsonType: 'user',
                username: req.body.username,
                hash: hash,
                salt: salt,
                email: req.body.email,
                created_at: new Date(),
                updated_at: new Date()
              };

              db.save(userdoc.username, userdoc, function (err, result) {
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