var config = {};

/* ==============================================================
   The basics
=============================================================== */
config.title			= 'Snapvotr';
config.description		= 'Instant polling with your mobile phone!';
config.author	    	= 'Daniel Stroot';
config.version			= '1.0.0';

/* ==============================================================
   CouchDB Configuration
=============================================================== */
config.couchdb 			= {};
config.couchdb.url 		= 'https://posterist.cloudant.com';
config.couchdb.port 	= 443;
config.couchdb.username = 'posterist';
config.couchdb.password = 'ksolNiWxEQFanJ7';

// iriscouch
config.iriscouch 			= {};
config.iriscouch.url 		= 'https://snapvotr.iriscouch.com';
config.iriscouch.port 		= 443;
config.iriscouch.username 	= 'dstroot';
config.iriscouch.password 	= 'aa853127';

/* ==============================================================
   Twilio Configuration
=============================================================== */
config.twilio 			= {};
config.twilio.sid 		= 'AC7487d0bacb8707cb32fc5f22bca7576e';
config.twilio.key 		= 'd75155958560d86f7199957b8fae2ca7';
config.twilio.disableValidation = false;

module.exports = config;