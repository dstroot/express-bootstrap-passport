'use strict'
/* ==============================================================
 *  Include required packages / Module Dependencies
 * ============================================================== */
var crypto          = require('crypto');

/**
 * Returns a hashed password
 *
 * Examples:
 *
 *   utils.hash('password', 'salt')
 *
 * @param  {string} pass
 * @param  {string} salt
 * @return {string}
 * @api private
 */

exports.hash = function (pass, salt) {
  var h = crypto.createHash('sha512');
  h.update(pass);
  h.update(salt);
  return h.digest('base64');
};