'use strict'
/* ==============================================================
    Include required packages / Module Dependencies
=============================================================== */
var config          = require('../config')
  , utils           = require('../utils')
  , fs              = require('fs')              // http://nodejs.org/docs/v0.3.1/api/fs.html
  , path            = require('path')            // http://nodejs.org/docs/v0.3.1/api/path.html
  , flash           = require('connect-flash')   // https://npmjs.org/package/connect-flash 
  , passport        = require('passport')        // https://npmjs.org/package/passport
  , LocalStrategy   = require('passport-local').Strategy  // See above
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
          "byUsername": {
              "map": "function (doc) { if (doc.username) { emit(doc.username, doc) } }"
          },
          "byEmail": {
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
      
      // Define the user document
      var testuser = {
        jsonType: 'user',
        username: 'Dan',
        hash: '',
        salt: '',
        email: 'dan@somedomain.com',
        created_at: new Date(),
        updated_at: new Date()
      };

      // Hash the password (password is hardcoded as "passw0rd")
      pass.hash('passw0rd', function(error, salt, hash){
        if (error) throw err;
        
        // update the salt & hash
        testuser.hash = hash;
        testuser.salt = salt;

        // Save the record to the database
        db.save(null,             // Document ID, let couchDB assign
        testuser,                 // Document Contents (testuser above)
        function(error1, result) {
          if(!error1) {
            console.log("Added Test User" + result + '\n');
          } else {
            console.log("Error: " + error + '\n');
            throw err;
          }
        });
      });
    });
  }
});

/* ===================================================
   Needed for Passport 
====================================================== */
// Doesn't need to query via a view, can just get doc by id directly
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
/* =========================================================
 * FINDBY: Looks up users in the database either by name
 *         or email address.
 *
 * @param {String} should be either 'Username' or 'Email'
 * @param {String} key you want, 'Dan' or 'dan@dan.com'
 * @param {Function} callback
 *
 * Examples:
 *   findBy('Username', 'Dan', callback)
 * ========================================================== */
function findBy(attr, val, callback) {
  db.view('user/by'+(attr), {key: val}, function (err, res) { 
    if (err) {
      var msg = 'Error: ' + attr + ', ' + val;
      //console.log(msg);
      callback(msg, null);
    } else {
      if (res.length === 0) {
        var msg = 'No matching user: ' + attr + ', ' + val;
        //console.log(msg);
        callback(null, null);
      } else {
        var user = res[0].value;
        // should show only on console variable
        //var util = require('util');
        //console.log('Event inspected: ' + util.inspect(user, true, null, true));
        callback(null, user);                    
      }
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
passport.serializeUser(function (user, done) {
  done(null, user._id); 
});

passport.deserializeUser(function (id, done) {
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
      
      findBy('Username', username, function (err, user) {
        if (err) { return done(err); }
        if (!user) {   // If no user found
          return done(null, false, { message: '<strong>Oh Snap!</strong> We do not recognize your username ' + username + '.'}); 
        } else {       // Check password
          pass.hash(password, user.salt, function (error, hash){
            if (error) { return done(error); }
            if (user.hash !== hash) {  // doesn't match
              return done(null, false, { message: '<strong>Oh Snap!</strong> Your password does not match.' }); 
            } else {                   // matches
              return done(null, user);
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
  app.get('/logout', ensureAuthenticated, logout);
  app.get('/welcome', welcome);

  //Retrieve a user's tags
  //-------------------------------------------------------------
  app.get('/json/username', function(req, res) {

    var parsedurl = require('url').parse(req.url, true);
    console.log('Query Value: ' + parsedurl.query.value);
    
    findBy('Username', parsedurl.query.value, function (err, user) {
        var msg = {};
        var d = new Date();
        if (user) {    
          // Found User! Bail out...
          // JSON response
          msg =  {
            "value": "username"+d.getMilliseconds(),
            "valid": 0,
            "message": "We already have someone..."
          };
        } else {
          // JSON response
          msg =  {
            "value": "username",
            "valid": true,
            "message": "OK"
          };
        }

        res.setHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store');
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.write(JSON.stringify(msg), 'utf-8');
        res.end('\n');                   
      });  
      
  });
  
  // -- POST Routes
  app.post('/register', register);
  app.post('/login', passport.authenticate('local', { successRedirect: '/account',
                                                      failureRedirect: '/login',
                                                      failureFlash: true }) );

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
};

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
};

///GET /500
///////////////////////////////
var fivehundred = function(req, res, next){
  // trigger a generic (500) error
  next(new Error('Testing 1,2,3!'));
};

//POST /signup
///////////////////////////////////////////////////////////////
var register = function(req, res) {

  findBy('Username', req.body.username, function (err, user) {
      if (user) {    // Found User! Bail out...
        //console.log('Found user:' + user.username);
        req.flash('error', '<strong>Oh Snap!</strong> We already have a user by that name.');
        res.redirect('/signup');
        } else {     // Check for an existing email address
          findBy('Email', req.body.email, function (err1, user1) {
            if (user1) {  // Found email!  Bail out...
              //console.log('Found email' + user1.username);
              req.flash('error', '<strong>Oh Snap!</strong> Sorry, We already have someone with that email address.');
              res.redirect('/signup'); 
            } else {   // User name and email does not yet exist - OK
              
              // Hash thier password
              pass.hash(req.body.password, function (err2, salt, hash) {
                
                if (err2) throw err;
                
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

                db.save(null, userdoc, function (err3, result) {
                  if(!err3) {
                    //console.log('Saved new user: success! ' + result);
                    // calling req.login below will make passportjs setup 
                    // the user object, serialize the user, etc.
                    // This has to be placed here *after* the database save 
                    // because the result gives us an object with an .id 
                    req.login(result, {}, function (err4) {
                      if (err4) { 
                        console.log('Passport login did not work!' + err); 
                      } else {
                        res.redirect("/welcome");
                      }
                    });
                  } else {
                    console.log('User save did not work!' + err); 
                    result.send(error.status_code);
                  }
                });
              });
            }
        });
      }
  });

};