
'use strict'
/* ==============================================================
    Include required packages / Module Dependencies
=============================================================== */
var express         = require('express')
  , http            = require('http')
  , path            = require('path')
  , fs              = require('fs')
  , UglifyJS        = require("uglify-js")        // https://npmjs.org/package/uglify-js
  , lessMiddleware  = require('less-middleware')  // https://npmjs.org/package/less-middleware
  , config          = require('./config')
  , flash           = require('connect-flash')    // needed for passport?
  , passport        = require('passport')
  , LocalStrategy   = require('passport-local').Strategy;

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
       ,'public/js/lib/bootstrap-carousel.js'
       ,'public/js/lib/bootstrap-collapse.js'
       ,'public/js/lib/bootstrap-dropdown.js'
       ,'public/js/lib/bootstrap-modal.js'
       ,'public/js/lib/bootstrap-popover.js'
       ,'public/js/lib/bootstrap-scrollspy.js'
       ,'public/js/lib/bootstrap-tab.js'
       ,'public/js/lib/bootstrap-tooltip.js'
       ,'public/js/lib/bootstrap-transition.js'
       ,'public/js/lib/bootstrap-typeahead.js' 
    ];
    
    // Minify all the files
    var minified = UglifyJS.minify(scripts);

    //write out the minifed code into one nice bundle
    fs.writeFileSync(__dirname + '/public/js/bootstrap.js', minified.code, 'utf8');
    if (showconsole) console.log('Writing bootstrap.js');

}

bundle();

/* ==============================================================
    Launch the server
=============================================================== */
var server = http.createServer(app).listen(app.get('port'), function(){
  if (showconsole) console.log("Express server listening on port %d in %s mode", app.get('port'), app.settings.env);
});

//==============================================================
//    Application Routing
//==============================================================
require('./routes')(app);