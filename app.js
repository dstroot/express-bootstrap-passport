
'use strict'                                    // for jshint
/* ==========================================================
 * utils.js v0.0.1
 * Author: Daniel J. Stroot
 * ========================================================== */

/* ==========================================================
 * Include required packages / Module Dependencies
 * ========================================================== */

var express         = require('express')
  , http            = require('http')             // http://nodejs.org/docs/v0.3.1/api/http.html
  , path            = require('path')             // http://nodejs.org/docs/v0.3.1/api/path.html
  , config          = require('./config')
  , utils           = require('./utils')
  , gzippo          = require('gzippo')           // https://npmjs.org/package/gzippo
  , lessMiddleware  = require('less-middleware')  // https://npmjs.org/package/less-middleware
  , flash           = require('connect-flash')    // https://npmjs.org/package/connect-flash (needed for passport?)
  , passport        = require('passport');        // https://npmjs.org/package/passport

var app = express();

/* ==============================================================
    Configuration
=============================================================== */
// Controls logging
var showconsole = true;   

// Used for session hashes
var salt = '47sdkfjk23';

var hour = 3600000;
var day = (hour * 24);
var month = (day * 30);

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
    res.locals.keywords     = config.keywords;
    res.locals.version      = config.version;
    next();
  });

  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon(__dirname + 'favicon.ico'));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());

  // ---  Initialize Passport!  
  // Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  // Must come after app.use(express.session());
  app.use(flash());  // for passport stuff
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
  
  // --- Compile Less to css
  app.use(lessMiddleware({ 
     dest: __dirname + '/public/css'
   , src: __dirname + '/less'
   , prefix: '/css'
   , compress: true
   , debug: true
  }));
  
  // Replace the static provider with gzippo's to serve up gzip'ed files
  app.use(gzippo.staticGzip(path.join(__dirname + '/public', { maxAge: day })));
  //app.use(express.static(path.join(__dirname, '/public')));

  // Routing and error handling
 
  // "app.router" positions our routes 
  // above the middleware defined below,
  // this means that Express will attempt
  // to match & call routes *before* continuing
  // on, at which point we assume it's a 404 because
  // no route has handled the request.

  app.use(app.router);

  // Since this is the last non-error-handling
  // middleware use()d, we assume 404, as nothing else
  // responded.

  // $ curl http://localhost:3000/notfound
  // $ curl http://localhost:3000/notfound -H "Accept: application/json"
  // $ curl http://localhost:3000/notfound -H "Accept: text/plain"

  app.use(function(req, res, next){
    res.status(404);
    
    // respond with html page
    if (req.accepts('html')) {
      res.render('404', { url: req.url });
      return;
    }

    // respond with json
    if (req.accepts('json')) {
      res.send({ error: 'Not found' });
      return;
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');
    
  });

  // error-handling middleware, take the same form
  // as regular middleware, however they require an
  // arity of 4, aka the signature (err, req, res, next).
  // when connect has an error, it will invoke ONLY error-handling
  // middleware.

  // If we were to next() here any remaining non-error-handling
  // middleware would then be executed, or if we next(err) to
  // continue passing the error, only error-handling middleware
  // would remain being executed, however here
  // we simply respond with an error page.

  app.use(function(err, req, res, next){
    // we may use properties of the error object
    // here and next(err) appropriately, or if
    // we possibly recovered from the error, simply next().
    res.status(err.status || 500);
    res.render('500', { error: err });
  });

}); 

/* ==============================================================
    Configuration Environments
=============================================================== */
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
    Launch the server
=============================================================== */
// Minify and bundle .js
utils.bundle();

// Launch Server
var server = http.createServer(app).listen(app.get('port'), function(){
  if (showconsole) console.log("Express server listening on port %d in %s mode", app.get('port'), app.settings.env);
});

//==============================================================
//    Application Routing
//==============================================================
require('./routes')(app);