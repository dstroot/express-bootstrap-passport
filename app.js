
'use strict'                                    // for jshint
/* ==========================================================
 * app.js     v0.0.1
 * Author:    Daniel J. Stroot
 * Date:      01.07.2013
 * ========================================================== */

/* ==========================================================
 * Include required packages / Module Dependencies
 * ========================================================== */

var express         = require('express')
  , config          = require('./config')
  , utils           = require('./utils')
  , http            = require('http')             // http://nodejs.org/docs/v0.3.1/api/http.html
  , path            = require('path')             // http://nodejs.org/docs/v0.3.1/api/path.html
  , lessMiddleware  = require('less-middleware')  // https://npmjs.org/package/less-middleware
  , flash           = require('connect-flash')    // https://npmjs.org/package/connect-flash (needed for passport?)
  , passport        = require('passport');        // https://npmjs.org/package/passport

var app = express();

// Controls logging
var showconsole = true;   


// define a custom res.message() method which stores messages in the session
// Taken from Express MVC example (better than connect-flash?)
app.response.message = function(msg){
  // reference 'req.session' via the 'this.req' reference
  var sess = this.req.session;
  // simply add the msg to an array for later
  sess.messages = sess.messages || [];
  sess.messages.push(msg);
  return this;
};

/* ==============================================================
  Setup Redis for a Session Store
=============================================================== */

// To use RedisToGo as a session store!
// URL format = 'redis://username:password@my.host:6789'
// http://scottwoodall.com/configure-express-nodejs-to-connect-to-redistogo-on-heroku-for-sessions/

// Used for session length
var hour = 3600000;
var day = (hour * 24);
var month = (day * 30);

// https://npmjs.org/package/connect-redis
var RedisStore = require('connect-redis')(express); 

// Parse the RedisToGo URL into variable 'rtg'
var rtg   = require('url').parse(config.redis.togourl);

/* ==============================================================
    Configuration
=============================================================== */

app.configure(function(){

  /* =================================================
   The app.locals object is passed to all templates, 
   and it’s how helpers are defined in Express 3 applications. 
   This is useful for providing helper functions to templates, 
   as well as app-level data.
  =================================================== */
  
  app.locals({
    title: config.title,
    email: config.email,
    description: config.description,
    author: config.author,
    keywords: config.keywords,
    version: config.version,
    google: config.google.analytics
  });

  app.locals.errors = {};
  app.locals.message = {};
  
  // http://expressjs.com/api.html#app.locals
  // https://github.com/visionmedia/express/wiki/New-features-in-3.x
  // Reading above most of these should be moved to app.locals
  // app.locals are app-wide, res.locals are response specific.

  app.use(function(req, res, next){
    res.locals.session      = req.session;
  //  res.locals.title        = config.title;
  //  res.locals.description  = config.description;
  //  res.locals.author       = config.author;
  //  res.locals.keywords     = config.keywords;
  //  res.locals.version      = config.version;
  //  res.locals.google       = config.google.analytics;
    next();
  });

  /* =================================================
  NOTE: The port environment variable is process.env.PORT, 
  assign its value to the port variable, or assign 8080 if 
  environment variable is not set (doesn't exist).
  =================================================== */

  app.set('port', process.env.PORT || 8080);

  /* =================================================
   View Engine 
  =================================================== */

  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  /* =================================================
   Other Middleware 
  =================================================== */

  // Deliver the favicon
  app.use(express.favicon(__dirname + '/public/ico/favicon.ico'));
  // logging
  app.use(express.logger('dev'));
  // parse request bodies (req.body)
  app.use(express.bodyParser());
  // support _method (PUT in forms etc)
  app.use(express.methodOverride());

  /* =================================================
   Session Storage (need cookieParser and session)
  =================================================== */

  // cookieParser is required by session() middleware
  // pass the secret for signed cookies These two *must*
  // be placed in the order shown.

  app.use(express.cookieParser('dM3nMWcxF85n'));
  
  // session() populates req.session.

  //app.use(express.session());  // Memory store
  
  // The default session store is just your server's memory.
  // Thus a reboot wipes out your sessions and is of course
  // not scalable beyond a single server.  Lets use Redis:
  
  app.use(express.session({ 
    store: new RedisStore({ 
      host: rtg.hostname, 
      port: rtg.port, 
      db: rtg.auth.split(':')[0], 
      pass: rtg.auth.split(':')[1]
    }), 
    secret: config.redis.salt, 
    maxAge: month 
  }));
  
  /* =================================================
   Passport Authentication 
  =================================================== */
  // Important! Must come *after* session middleware: app.use(express.session());
  // Initialize Passport and also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  
  // IDK what this is below, I think it's for if you want to *not* use flash messages
  /*
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

  // Taken from Express MVC example
  // better than connect-flash?

  // expose the "messages" local variable when views are rendered
  app.use(function(req, res, next){
    var msgs = req.session.messages || [];

    // expose "messages" local variable
    res.locals.messages = msgs;

    // expose "hasMessages"
    res.locals.hasMessages = !! msgs.length;

    // empty or "flush" the messages so they don't build up
    req.session.messages = [];
    next();
  });

  */

  app.use(flash());  // for passport messages
  app.use(passport.initialize());
  app.use(passport.session());
  
  /* =================================================
   Complile the Less code to css 
  =================================================== */

  // When we get a request for a css file the less middleware 
  // sees if exists.  If not it looks for a similarly named 
  // Less file and compiles it.

  // GET /styles.css will cause styles.less > styles.css
  // Simple no?

  app.use(lessMiddleware({ 
     dest: __dirname + '/public/css'
   , src: __dirname + '/less'
   , prefix: '/css'
   , compress: true
   , debug: false
  }));

  /* =================================================
   Serving Static Files / Favicon
  =================================================== */

  // express on its own has no notion of a "file". The express.static()
  // middleware checks for a file matching the `req.path` within the directory
  // that you pass it. In this case "GET /js/app.js" will look for "./public/js/app.js".

  // if you want to serve files from several directories, you can use express.static()
  // multiple times! Here we're passing "./public/css", this will allow "GET /style.css" 
  // instead of "GET /css/style.css".  This means we can put our assets in sub-directories
  // but keep this stuff of out HTML /js /css /ico  etc.

  // Order is important! You may `app.use(app.router)` before or after these
  // static() middleware. If placed before them your routes will be matched 
  // BEFORE file serving takes place. If placed after as shown here then 
  // file serving is performed BEFORE any routes are hit.

  app.use(express.compress());     // for GZIP compression
  app.use(express.static(__dirname + '/public'));
  app.use(express.static(__dirname + '/public/css'));
  app.use(express.static(__dirname + '/public/ico'));
  app.use(express.static(__dirname + '/public/img'));
  app.use(express.static(__dirname + '/public/js'));
  app.use(express.static(__dirname + '/public/js/lib'));

  /* =================================================
   Application Routing (and error handling)
  =================================================== */
 
  // "app.router" positions our routes above the middleware defined below,
  // this means that Express will attempt to match & call routes *before* 
  // continuing on, at which point we assume it's a 404 because no route 
  // has handled the request.

  app.use(app.router);

  // Since this is the last non-error-handling middleware use()d, 
  // we assume 404, as nothing else responded.  Test:
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

  // Error-handling middleware, take the same form as regular middleware, 
  // however they require an arity of 4, aka the signature (err, req, res, next).
  // when connect has an error, it will invoke ONLY error-handling middleware.

  // If we were to next() here any remaining non-error-handling middleware would 
  // then be executed, or if we next(err) to continue passing the error, only 
  // error-handling middleware would remain being executed, however here we 
  // simply respond with an error page.

  app.use(function(err, req, res, next){
    // we may use properties of the error object
    // here and next(err) appropriately, or if
    // we possibly recovered from the error, simply next().
    res.status(err.status || 500);
    res.render('500', { error: err });
    console.log('Caught exception: '+err+'\n'+err.stack);
    console.log('\u0007'); // Terminal bell
  });

}); 

/* ==============================================================
    Configuration Environments
=============================================================== */
/* ==============================================================
  NOTE: To alter the environment we can set the NODE_ENV environment 
  variable, for example:

    $ NODE_ENV=production node app.js

  This is *very* important, as many caching mechanisms are *only* 
  enabled when in production.
=============================================================== */

app.configure('development', function(){
    showconsole = true;   // Turn on logging 

  // Keep search engines out using robots.txt
  app.all('/robots.txt', function(req,res) {
    res.charset = 'text/plain';
    res.send('User-agent: *\nDisallow: /');
  });

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
  showconsole = false;   // Turn off logging
  app.use(express.errorHandler());

  // Allow all search engines  www.robotstxt.org/
  // www.google.com/support/webmasters/bin/answer.py?hl=en&answer=156449
  app.all('/robots.txt', function(req,res) {
    res.charset = 'text/plain';
    res.send('User-agent: *');
  });
  
});

/* ==============================================================
    Launch the server
=============================================================== */
// Minify and bundle our .js files
// Not sure this is the best way anymore. Used to be that serving one
// big .js file was faster than requesting a bunch of small ones but with
// Loading libraries like head.js this might be moot.

utils.bundle();

// Launch Server

var server = http.createServer(app).listen(app.get('port'), function(){
  if (showconsole) console.log("Express server listening on port %d in %s mode", app.get('port'), app.settings.env);
});

//==============================================================
//    Application Routing
//==============================================================

require('./routes')(app);