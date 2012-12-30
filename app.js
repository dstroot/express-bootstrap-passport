
'use strict'
/* ==============================================================
    Include required packages / Module Dependencies
=============================================================== */
var express         = require('express')
//  , routes          = require('./routes')
//  , user            = require('./routes/user')
  , http            = require('http')
  , path            = require('path')
  , fs              = require('fs')
  , UglifyJS        = require("uglify-js")        // https://npmjs.org/package/uglify-js
  , lessMiddleware  = require('less-middleware')  // https://npmjs.org/package/less-middleware
  , socketio        = require('socket.io')        // https://npmjs.org/package/socket.io
//  , utils           = require('./utils')
  , config          = require('./config')
//  , events          = require('./events')
//  , twiliosig       = require('twiliosig')
  , flash           = require('connect-flash')
//  , util            = require('util')
  , passport        = require('passport');
//  , LocalStrategy   = require('passport-local').Strategy;

var app = express();

/* ==============================================================
    Configuration
=============================================================== */
var showconsole = true;   // Controls logging

app.configure(function(){
  /* =================================================
   The app.locals object is passed to all templates, 
   and it’s how helpers are defined in Express 3 applications. 
  =================================================== */
  app.locals.errors = {};
  app.locals.message = {};

  app.use(function(req, res, next){
    res.locals.session      = req.session;
    res.locals.title        = config.title;
    res.locals.description  = config.description;
    res.locals.author       = config.author;
    res.locals.version      = config.version;
    next();
  });

  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(flash());  // for passport stuff
  app.use(express.session());
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(function(req, res, next) {
    if(req.isAuthenticated()) {
      res.locals.user = req.user
    }
    var msgs = req.session.messages || []
    res.locals({
      messages: msgs,
      hasMessages: !! msgs.length
    })
    req.session.messages = []
    next()
  })
  //////////////////////////////
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(lessMiddleware({      // complile less to css
     dest: __dirname + '/public/css'
   , src: __dirname + '/less'
   , prefix: '/css'
   , compress: true
   , debug: true
  }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(function(err, req, res, next){
    console.error(err.stack);
    res.render('500', { 
      err: err.message,
      url: req.url
    });
  });
}); 

app.configure('development', function(){
  showconsole = true;        // Turn on logging 
  app.locals.pretty = true;  // line breaks in the jade output
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(express.logger(
    function(tokens, req, res){
      var status = res.statusCode, color = 32;
  
      if (status >= 500) color = 31
      else if (status >= 400) color = 33
      else if (status >= 300) color = 36;

      return '\x1B[90m' + req.method
      + ' ' + req.originalUrl + ' '
      + '\x1B[' + color + 'm' + res.statusCode
      + ' \x1B[90m'
      + (new Date - req._startTime)
      + 'ms\x1B[0m'
      + " C: " + JSON.stringify(req.headers);
    }
  ));
});

app.configure('production', function(){  
  showconsole = false;
  app.use(express.errorHandler());
});

/* ==============================================================
    Concatentate and minify all the .js libraries
=============================================================== */
function bundle() {

    var scripts = [
        // Bootstrap libraries  https://github.com/twitter/bootstrap/
        'public/js/lib/bootstrap-affix.js'
       ,'public/js/lib/bootstrap-alert.js'
       ,'public/js/lib/bootstrap-button.js'
       //,'public/js/lib/bootstrap-carousel.js'
       ,'public/js/lib/bootstrap-collapse.js'
       ,'public/js/lib/bootstrap-dropdown.js'
       ,'public/js/lib/bootstrap-modal.js'
       ,'public/js/lib/bootstrap-popover.js'
       //,'public/js/lib/bootstrap-scrollspy.js'
       ,'public/js/lib/bootstrap-tab.js'
       ,'public/js/lib/bootstrap-tooltip.js'
       ,'public/js/lib/bootstrap-transition.js'
       //,'public/js/lib/bootstrap-typeahead.js' 
    ];
    
    // Minify all the files
    var minified = UglifyJS.minify(scripts);

    //write out the minifed code
    fs.writeFileSync(__dirname + '/public/js/bundle.js', minified.code, 'utf8');
    if (showconsole) console.log('Writing bundle.js');

}

bundle();

/* ==============================================================
    Launch the server
    variable "server" for socket.io bind with/listen
=============================================================== */

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port %d in %s mode", app.get('port'), app.settings.env);
});

/* ==============================================================
    Socket.io Configuration
=============================================================== */

//https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO 

// flashsocket will not activate on Chrome or other browsers that 
// fully support WebSockets, even if flashsocket is specified as 
// the only transport. To test flashsocket, use IE 8 or IE 9, or 
// other browsers that don't natively support WebSockets.

// If you are using a hosting provider that doesn't allow you start servers 
// other then on port 80 or the provided port and you still want to support 
// flashsockets you can set the flash policy port to -1 before you set the 
// transports option.  This will instruct the policyfile server to only serve 
// inline policy file requests over your supplied HTTP server. This affect 
// the the initial connection time because the flash player will still search 
// for a dedicated policy file server before it falls back to requesting the 
// policy file inline over the supplied connection.

var io = socketio.listen(server, {
  //'flash policy port': -1                  // may need for flashsocket
});

io.configure('production', function(){
  io.enable('browser client minification');  // send minified client
  io.enable('browser client etag');          // apply etag caching logic based on version number
  io.enable('browser client gzip');          // gzip the file
  io.set('log level', 1);                    // reduce logging
  io.set("polling duration", 10);            // increase polling frequency
  io.set('transports', [                     // Manage transports
      'websocket'
    //, 'flashsocket'                        // needed for IE 8, 9?
    , 'htmlfile'
    , 'xhr-polling'
    , 'jsonp-polling'
  ]);
});

io.configure('development', function(){
  io.set('transports', [
    'websocket'                              // Let's just use websockets for development
  ]);      
});

io.sockets.on('connection', function(socket){
    socket.on('event', function(event){
        socket.join(event);
        console.log('Client connected!');
        console.log('Socket.io event emitted from client: ' + event); 
    });
});

//==============================================================
//    Application Routing
//==============================================================

require('./routes')(app, io);