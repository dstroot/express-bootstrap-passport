'use strict'
/* ==============================================================
    Include required packages / Module Dependencies
=============================================================== */
var fs              = require('fs')
  , path            = require('path')
  , config          = require('../config')
  , utils 					= require('../utils')
  , twiliosig 			= require('twiliosig')
  , events 					= require('../events')
  , flash           = require('connect-flash')
  , util            = require('util')
  , passport        = require('passport')
  , LocalStrategy   = require('passport-local').Strategy
  , cradle          = require('cradle')
  , crypto          = require('crypto')
  , io;

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
   Create the design docs (Views)
   * here in case the nested method above craps out *
======================================================
db.exists(function (err, exists) {
  if (err) {
    console.log('Error2', err);
  } else if (exists) {

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

  } else {
    console.log('Database does not exist');
  }
});
*/

/* ===================================================
   Test your couchDB connection
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
// Is hash needed here?
var hash = function (pass, salt) {
  var h = crypto.createHash('sha512');
  h.update(pass);
  h.update(salt);
  return h.digest('base64');
};

var testuser = {
    jsonType: 'user',
    username: 'Daniel',
    password: hash('Boogers', 'Daniel'),
    created_at: new Date(),
    updated_at: new Date()
};

db.save(testuser.username,   // Document Name
  testuser,                  // Document Contents (user above)
  function(error, result) {
    if(!error) {
      console.log("Added Test User", result);
    } else {
      console.log("Error4: ", error);
    }
});
/*
User Profile  http://passportjs.org/guide/profile/

When authenticating using a third-party service such as Facebook 
or Twitter, user profile information will often be available. Each 
service tends to have a different way of encoding this information. 
To make integration easier, Passport normalizes profile information 
to the extent possible.

Normalized profile information conforms to the contact schema 
established by Portable Contacts. The common fields available are 
outlined in the following table.
*/

var userRecord =
          {
            "provider": "Twitter",
            "id": "703887",
            "displayName": "Mork Hashimoto",
            "name": {
              "familyName": "Hashimoto",
              "givenName": "Mork"
            },
            "birthday": "0000-01-16",
            "gender": "male",
            "drinker": "heavily",
            "tags": [
              "plaxo guy",
              "favorite"
            ],
            "emails": [
              {
                "value": "mhashimoto-04@plaxo.com",
                "type": "work",
                "primary": "true"
              },
              {
                "value": "mhashimoto-04@plaxo.com",
                "type": "home"
              }
            ],
            "urls": [
              {
                "value": "http://www.seeyellow.com",
                "type": "work"
              },
              {
                "value": "http://www.angryalien.com",
                "type": "home"
              }
            ],
            "phoneNumbers": [
              {
                "value": "KLONDIKE5",
                "type": "work"
              },
              {
                "value": "650-123-4567",
                "type": "mobile"
              }
            ],
            "photos": [
              {
                "value": "http://sample.site.org/photos/12345.jpg",
                "type": "thumbnail"
              }
            ],
            "ims": [
              {
                "value": "plaxodev8",
                "type": "aim"
              }
            ],
            "addresses": [
              {
                "type": "home",
                "streetAddress": "742 Evergreen Terrace\nSuite 123",
                "locality": "Springfield",
                "region": "VT",
                "postalCode": "12345",
                "country": "USA",
                "formatted": "742 Evergreen Terrace\nSuite 123\nSpringfield, VT 12345 USA"
              }
            ],
            "accounts": [
              {
                "domain": "plaxo.com",
                "userid": "2706"
              }
            ]
          };

// fake users for test data
var users = [
    { id: 1, username: 'bob', password: 'secret', email: 'bob@example.com' }
  , { id: 2, username: 'joe', password: 'birthday', email: 'joe@example.com' }
];

function findById(id, fn) {

  db.get(id, function(error, result) {
    if (!error) {
      fn(null, result);
    } else {
      fn(new Error('User ' + id + ' does not exist'));
    }
  });



  //var idx = id - 1;
  //if (users[idx]) {
  //  fn(null, users[idx]);
  //} else {
  //  fn(new Error('User ' + id + ' does not exist'));
  //}
}
  // Query users by ID
  //, findByID = exports.findById = function(id, callback) {
  //    users.get('id:'+id, function(error, result) {
  //      if (!error) {
  //        callback(null, result);
  //      } else {
  //        callback(new Error('User ' + id + ' does not exist'));
  //      }
  //    });
  //}


//function findByUsername(username, fn) {
//  for (var i = 0, len = users.length; i < len; i++) {
//    var user = users[i];
//    if (user.username === username) {
//      return fn(null, user);
//    }
//  }
//  return fn(null, null);
//}

  /* ===================================================
     Query by Username
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

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});

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
      })
    });
  }
));

/* ==============================================================
    Here's all the routing
=============================================================== */
module.exports = function(app, socketio) {
  
  io = socketio;

  // GET Routes
  app.get('/', index);
  app.get('/events/:shortname', ensureAuthenticated, event);
  app.get('/account', ensureAuthenticated, account);
  app.get('/signup', signup);
  app.get('/welcome', welcome);
  app.get('/login', login);
  app.get('/logout', logout);
  app.get('/poll/:shortname', ensureAuthenticated, event);
	app.get('/robots*', robots);
	app.get('/humans*', humans);
	app.get('/users', userlist);
	// 404 route (always last!)
	app.get('/*', fourofour);
  
  //POST Routes
  app.post('/signup', registerUser);
  app.post('/vote/sms', voteSMS);
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

//GET /events/shortname
//////////////////////////////////////////////////////////////
var event = function(req, res){
    
  events.findBy('shortname', req.params.shortname, function(err, event) {
    if (event) {
      // remove sensitive data
      event.voteoptions.forEach(function(vo){ 
          delete vo.numbers;
      });

      res.render('event', {
          user: req.user,
          name: event.name, 
          shortname: event.shortname, 
          state: event.state,
          phonenumber: utils.formatPhone(event.phonenumber), 
          voteoptions: JSON.stringify(event.voteoptions)   
      });
    }
    else {
      res.statusCode = 404;
      res.send('We could not locate your event');
    }
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

//GET /poll/shortname
///////////////////////////////
var poll = function(req, res){
    
  events.findBy('shortname', req.params.shortname, function(err, poll) {
    if (poll) {
      // remove sensitive data
      poll.voteoptions.forEach(function(vo){ 
          delete vo.numbers;
      });

      res.render('poll', {
          user: req.user,
          name: poll.name, 
          shortname: poll.shortname, 
          state: poll.state,
          phonenumber: utils.formatPhone(poll.phonenumber), 
          voteoptions: JSON.stringify(poll.voteoptions)   
      });
    }
    else {
      res.statusCode = 404;
      res.send('We could not locate your event');
    }
  });

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

//GET /users
///////////////////////////////
var userlist = function(req, res){
  res.send("respond with a resource");
};

///GET (something we don't a route for)
///////////////////////////////
var fourofour = function(req, res, next) {
  
    //Don't process requests for assets
    if (req.url.indexOf('/css') == 0 ) return next();
    if (req.url.indexOf('/img') == 0 ) return next();
    if (req.url.indexOf('/ico') == 0 ) return next();
    if (req.url.indexOf('/js') == 0 ) return next();
    if (req.url.indexOf('/fonts') == 0 ) return next();
    if (req.url.indexOf('humans*.*') == 0 ) return next();
    if (req.url.indexOf('robots*.*') == 0 ) return next();
    
    res.render('404', { url: req.url });
};

//POST an event
///////////////////////////////
var voteSMS = function(request, response) {

    if (twiliosig.valid(request, config.twilio.key) || config.disableTwilioSigCheck) {
        response.header('Content-Type', 'text/xml');
        var body = request.param('Body').trim();
        
        // the number the vote it being sent to (this should match an Event)
        var to = request.param('To');
        
        // the voter, use this to keep people from voting more than once
        var from = request.param('From');

        events.findBy('phonenumber', to, function(err, event) {
            if (err) {
                console.log(err);
                // silently fail for the user
                response.send('<Response></Response>'); 
            }
            else if (event.state == "off") {
                response.send('<Response><Sms>Voting is now closed.</Sms></Response>');                 
            }
            else if (!utils.testint(body)) {
                console.log('Bad vote: ' + event.name + ', ' + from + ', ' + body);
                response.send('<Response><Sms>Sorry, invalid vote. Please text a number between 1 and '+ event.voteoptions.length +'</Sms></Response>'); 
            } 
            else if (utils.testint(body) && (parseInt(body) <= 0 || parseInt(body) > event.voteoptions.length)) {
                console.log('Bad vote: ' + event.name + ', ' + from + ', ' + body + ', ' + ('[1-'+event.voteoptions.length+']'));
                response.send('<Response><Sms>Sorry, invalid vote. Please text a number between 1 and '+ event.voteoptions.length +'</Sms></Response>'); 
            } 
            else if (events.hasVoted(event, from)) {
                console.log('Denying vote: ' + event.name + ', ' + from);
                response.send('<Response><Sms>Sorry, you are only allowed to vote once.</Sms></Response>'); 
            }
            else {
                
                var vote = parseInt(body);
                    
                events.saveVote(event, vote, from, function(err, res) {
                    if (err) {
                        response.send('<Response><Sms>We encountered an error saving your vote. Try again?</Sms></Response>');  
                    }
                    else {
                        console.log('Accepting vote: ' + event.name + ', ' + from);
                        io.sockets.in(event.shortname).emit('vote', vote);
                        response.send('<Response><Sms>Thanks for your vote for ' + res.name + '. Powered by Twilio.</Sms></Response>');   
                    }
                });
            }  
        }); 
    }
    else {
        response.statusCode = 403;
        response.render('forbidden');
    }
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
    res.redirect('/events/demo');
};