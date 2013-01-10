'use strict'                                    // for jshint
/* ==========================================================
 * config.js    v0.0.1
 * Author:      Daniel J. Stroot
 * Date:        01.07.2013
 * ========================================================== */

/* ==========================================================
 * The basics
 * ========================================================== */
var config = {};
config.title            = 'Bootstrap';
config.description      = 'Sleek, intuitive, and powerful front-end framework for faster and easier web development.';
config.author           = '@MDO and @FAT';
config.email            = 'someone@somewhere.com'
config.keywords         = 'cool, smooth, rockin!'
config.version          = '2.2.2';

/* ==========================================================
 * CouchDB Configuration
 * ========================================================== */
config.couchdb          = {};
config.couchdb.url      = 'https://xxx.cloudant.com';
config.couchdb.port     = 443;
config.couchdb.username = 'xxx';
config.couchdb.password = 'hhr666h6yu6h6';

/* ==========================================================
 * Redis Configuration (for sessions)
 * ========================================================== */
config.redis            = {};
config.redis.togourl    = 'redis://you:passw0rd@carp.redistogo.com:9458/';
config.redis.salt       = 'rththtrt66577567';
//config.redis.host       = '127.0.0.1';   // Not needed for RedistoGo
//config.redis.port       = '6379';        // Not needed for RedistoGo
//config.redis.pass       = 'myredispass'; // Not needed for RedistoGo

/* ==========================================================
 * Misc
 * ========================================================== */
config.google           = {};
config.google.analytics = 'UA-xxxyyzzz-1';

module.exports = config;