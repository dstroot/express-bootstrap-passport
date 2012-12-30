'use strict'
/* ==============================================================
    Include required packages / Module Dependencies
=============================================================== */
var fs              = require('fs')
  , path            = require('path')
  , config          = require('../config')
  , utils 					= require('../utils')
  , flash           = require('connect-flash')
  , util            = require('util')
  , passport        = require('passport')
  , LocalStrategy   = require('passport-local').Strategy
  , cradle          = require('cradle')
  , crypto          = require('crypto');

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
      console.log('Database exists!');
  } else {
      console.log('Database does not exist - creating it!');
      db.create(function (err, exists) {
          if (err) {
              console.log('Could not create database: ', err);
          } else {
              console.log('Done! Created Database');
              
              // Define the design views    
              var designdoc = {
                "views": {
                  "byUserName": {
                    "map": "function (doc) { if (doc.username) { emit(doc.username, doc) } } "
                  },
                  "byUserEmail": {
                    "map": "function (doc) { if (doc.email) { emit(doc.email, doc) } } "
                  },
                  "all": {
                    "map": "function (doc) { if (doc.name) emit(doc.name, doc); }"
                  }  
                }
              };

              // Save the doc
              db.save('_design/user', designdoc, function (err, res) {
                if (err) {
                    // Handle error
                    console.log('Cannot add Design Doc!', err);
                } else {
                    // Handle success
                    console.log('Added Design Doc', res);
                }
              });
          }
      });
  }
});

/* ===================================================
   Test your couchDB connection (save and get a doc)
====================================================== */
db.save('document_key', {
    name: 'A Funny Name'
}, function (err, res) {
    if (err) {
        // Handle error
        console.log(' SAVE ERROR: Could not save record!!\n');
    } else {
        // Handle success
        console.log(' SUCESSFUL SAVE\n');
    }
    db.get('document_key', function (err, doc) {
      if (err) {
        // Handle error
        console.log(' GET ERROR: Could not get record!!\n');
      } else {
        // Handle success
        console.log('DOCUMENT: ' + doc + '\n');
      }
    });
});

/* ===================================================
   Save a test User
====================================================== */
var hash = function (pass, salt) {
  var h = crypto.createHash('sha512');
  h.update(pass);
  h.update(salt);
  return h.digest('base64');
};

var testuser = {
    jsonType: 'user',
    username: 'Dan',
    password: hash('passw0rd', 'Dan'),
    created_at: new Date(),
    updated_at: new Date()
};

db.save(testuser.username,   // Document Name
  testuser,                  // Document Contents (user above)
  function(error, result) {
    if(!error) {
      console.log("Added Test User", result);
    } else {
      console.log("Error: ", error);
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
   Needed for Passport 
====================================================== */
/*  Simple route middleware to ensure user is authenticated.
 *  Use this route middleware on any resource that needs to 
 *  be protected.  If the request is authenticated (typically 
 *  via a persistent login session), the request will proceed.
 *  Otherwise, the user will be redirected to the login page. */                 
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
 *   the user by ID when deserializing.  */
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
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.password != hash(password, user.username)) { return done(null, false, { message: 'Invalid password' }); }
        //if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      });
    });
  }
));

/* ==============================================================
    Here's all the routing
=============================================================== */
module.exports = function(app) {

  // GET Routes
  app.get('/', index);
  app.get('/account', ensureAuthenticated, account);
  app.get('/signup', signup);
  app.get('/login', login);
  app.get('/logout', logout);
  app.get('/welcome', welcome);
	app.get('/robots*', robots);
	app.get('/humans*', humans);
	// 404 route (always last!)
	app.get('/*', fourofour);
  
  //POST Routes
  app.post('/signup', registerUser);
  app.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), postlogin);

};

/* ==============================================================
    Here's route code (the rendering is placed in a variable and
    called in the routing above)
=============================================================== */

//POST /signup
///////////////////////////////////////////////////////////////
var registerUser = function(req, res) {

  var userdoc = {
    jsonType: 'user',
    username: req.body.username,
    password: hash(req.body.password, req.body.username),
    email: req.body.email,
    created_at: new Date(),
    updated_at: new Date()
  };

  db.save(userdoc.username, 
    userdoc, 
    function(error, result) {
      if(!error) {
      } else {
        res.send(error.status_code)
      }
    }
  );

  req.logIn(userdoc.username, function(err) {
    if (err) { 
      console.log('Passport login did not work!', err);
      return res.redirect('/');
    } else {
      // Login success!
      console.log('Signup success!');
      return res.redirect('/events/demo' + req.user.username);
    }
  });

}

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
  res.render('account', { user: req.user });
};

//GET /login
//////////////////////////////////////////////////////////////
var login =function(req, res){
  res.render('login', { user: req.user, message: req.flash('error') });
};

//GET /logout
///////////////////////////////
var logout = function(req, res){
  req.logout();
  res.redirect('/');
};

//GET /robots
///////////////////////////////
var robots = function(req, res) {   
  fs.readFile(path.join(path.join(__dirname, '..'), '/public/robots.txt'), 'utf8', function(error, content) {
      if (error) console.log(error);
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end(content, 'utf-8');
  });
};

//GET /humans
///////////////////////////////
var humans = function(req, res) {   
  fs.readFile(path.join(path.join(__dirname, '..'), '/public/humans.txt'), 'utf8', function(error, content) {
      if (error) console.log(error);
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end(content, 'utf-8');
  });
};

///GET (something we don't a route for)
///////////////////////////////
var fourofour = function(req, res, next) {
  
    //Don't process requests for assets
    if (req.url.indexOf('/css') == 0 ) return next();
    if (req.url.indexOf('/img') == 0 ) return next();
    if (req.url.indexOf('/ico') == 0 ) return next();
    if (req.url.indexOf('/js') == 0 ) return next();
    if (req.url.indexOf('humans*.*') == 0 ) return next();
    if (req.url.indexOf('robots*.*') == 0 ) return next();
    
    res.render('404', { url: req.url });
};

// POST /login
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called.
//
//   curl -v -d "username=bob&password=secret" http://127.0.0.1:3000/login
//
//POST Login
///////////////////////////////
var postlogin = function(req, res) {
    res.redirect('/welcome');
};