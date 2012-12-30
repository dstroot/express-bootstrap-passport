var config = require('../config')
  , cradle = require('cradle')
  , crypto = require('crypto');

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
      db.create();
      
      setTimeout(function () {   // wait for the DB to be created
        /* ===================================================
        Create the design docs (Views)
        ====================================================== */
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

    , 1000);
  }
});

/* ===================================================
   Create the design docs (Views)
   * here in case the nested method above craps out *
====================================================== */
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

/* ===================================================
   Save a test User
====================================================== */
// Is hash needed here?
hash = function (pass, salt) {
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

/* ===================================================
   Query a view
====================================================== 
querying a row with a specific key
Lets suppose that you have a design document that you’ve created:

db.save(‘_design/user’, {
  views: 
    {
    byUserName: 
      {
        map: 'function (doc) { if (doc.resource === 'User') { emit(doc.username, doc) } }'
      }
    }
});

In CouchDB you could query this view directly by making an HTTP request to: 

/_design/User/_view/byUsername/?key="luke"

In cradle you can make this same query by using the .view() database function:
*/

db.view('user/byUserName', { key: 'Daniel' }, 
  function (err, doc) {
    if(!err) {
        console.log("Retrieved Test User", doc);
    } else {
        console.log("Error5: ", err);
    }
});




  // Query users by ID
  , findByID = exports.findById = function(id, callback) {
      users.get('id:'+id, function(error, result) {
        if (!error) {
          callback(null, result);
        } else {
          callback(new Error('User ' + id + ' does not exist'));
        }
      });
  }

  /* ===================================================
     Query by Username
  ====================================================== */
  , findByUserName = exports.findByUserName = function(username, callback) {
    db.get(username, function(error, result) {
      if (!error) {
        callback(null, result);
      } else {
        console.log('Error in findByUsername!', error);
      }
    });
  }


  //db.view('user/byUserName', { key: 'Daniel' }, 
  //function (err, doc) {
  //  if(!err) {
  //      console.log("Retrieved Test User", doc);
  //  } else {
  //      console.log("Error5: ", err);
  //  }
   //});

  /* ===================================================
     Delete a user record
  ====================================================== */
  , deleteUser = exports.deleteUser = function(req, res) {
    db.get(req.params.id, function (err, doc) {      // Get the Doc
      if (!err) {
            
          console.log("Found doc to delete:", doc);

          // Delete it
          db.remove(doc._id, doc._rev, function (error, result) {
              if (!error) {
                console.log("Successfully deleted doc:", result);
                res.send(200)
              } else {
                console.log('Error6:', error);
                res.send(500)
              }
          });

        } else {
            console.log('Error7:', err);
        }
    });
  }











  // Create a new user
  , registerUser = exports.registerUser = function(req, res) {
    var user = {
      jsonType: 'user',
      username: req.body.username,
      password: hash(req.body.password, req.body.username),
      created_at: new Date(),
      updated_at: new Date()
    };
    users.insert(user, 'user:'+user.username, function(error, result) {
      if(!error) {
        req.logIn(user, function(error) {
          res.redirect('/');
        });
      } else {
        res.send(error.status_code)
      }
    });
  }














  // query events based on either shortname or phonenumber (both unique keys)
  , findBy = exports.findBy = function(attr, val, callback, retries) {
      var retries = (typeof retries !== 'undefined') ? retries : 0;
      
      events.view('event/by'+utils.initcap(attr), {key: val}, function (err, res) { 
          if (err) {
              if (retries < 3) {
                  console.log('Failed to load event, retrying:  ' + attr + ', ' + val);
                  findBy(attr, val, callback, retries+1);
              }
              else
                  var msg = 'Failed to load event, DONE retrying: ' + attr + ', ' + val;
                  console.log(msg);
                  callback(msg, null);
          }
          else {
              if (res.length != 1) {
                var msg = 'No matching event: ' + attr + ', ' + val;
                  console.log(msg);
                  callback(msg, null);
              }
              else {
                  var event = res[0].value;  
                  callback(null, event);                    
              }
          }          
      }); 
  }

  // check to see if this user has voted for this event
  , hasVoted = exports.hasVoted = function(event, number) {
      var retval = false;
      event.voteoptions.forEach(function(vo){
        if (vo.numbers.indexOf(number) >= 0) {
          retval = true;
        }
      });
      return retval;
  }

  // persist the vote to the DB
  , saveVote = exports.saveVote = function(event, vote, from, callback) {
      var index = vote - 1;

      event.voteoptions[index].votes++;
      event.voteoptions[index].numbers.push(from);

      events.save(event._id, event, function(err, res) {
          if (err) {
            var msg = 'Failed to save vote for event id = ' + event._id + '. ' + JSON.stringify(err);
            console.log(msg);               
            callback(msg, null);
          }
          else {
            callback(null, event.voteoptions[index]);
          }

      });     

    };