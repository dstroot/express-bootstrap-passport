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
config.keywords         = 'cool, smooth, rockin!'
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
 * Redis Configuration (for sessions)
 * ========================================================== */
config.redis            = {};
config.redis.togourl    = 'redis://dstroot:8babf8f8767f3e4fa0c35731875a42e7@carp.redistogo.com:9458/';
config.redis.salt       = 'ksolNiWxEQFanJ7';
//config.redis.host       = '127.0.0.1';   // Not needed for RedistoGo
//config.redis.port       = '6379';        // Not needed for RedistoGo
//config.redis.pass       = 'myredispass'; // Not needed for RedistoGo

/* ==========================================================
 * Misc
 * ========================================================== */
config.google           = {};
config.google.analytics = 'UA-29437447-1';

module.exports = config;