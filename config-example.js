var config = {};

/* ==============================================================
   The basics
=============================================================== */
config.title			= 'Bootstrap';
config.description		= 'Sleek, intuitive, and powerful front-end framework for faster and easier web development.';
config.author	    	= '@MDO and @FAT';
config.version			= '2.2.2';

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

module.exports = config;