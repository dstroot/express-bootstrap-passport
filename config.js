'use strict'                                    // for jshint
/* ==========================================================
 * config.js v0.0.1
 * Author: Daniel J. Stroot
 * ========================================================== */

/* ==========================================================
 * The basics
 * ========================================================== */
var config = {};
config.title            = 'Bootstrap';
config.description      = 'Sleek, intuitive, and powerful front-end framework for faster and easier web development.';
config.author           = '@MDO and @FAT';
config.keywords         = 'cool, smooth, rockin'
config.version          = '2.2.2';

/* ==========================================================
 * CouchDB Configuration
 * ========================================================== */
config.couchdb          = {};
config.couchdb.url      = 'https://posterist.cloudant.com';
config.couchdb.port     = 443;
config.couchdb.username = 'posterist';
config.couchdb.password = 'ksolNiWxEQFanJ7';

/* ==========================================================
 * Misc
 * ========================================================== */
config.google           = {};
config.google.analytics = 'UA-29437447-1';

module.exports = config;