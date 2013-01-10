'use strict'                                    // for jshint
/* ==========================================================
 * utils.js   v0.0.1
 * Author:    Daniel J. Stroot
 * Date:      01.07.2013
 * ========================================================== */

/* ==========================================================
 * Include required packages / Module Dependencies
 * ========================================================== */

var fs              = require('fs')          // http://nodejs.org/docs/v0.3.1/api/fs.html
   ,UglifyJS        = require("uglify-js");  // https://npmjs.org/package/uglify-js

/* =========================================================
 * BUNDLE: Concatentate and minify all the .js libraries
 *
 * Examples:
 *   utils.bundle()
 * ========================================================== */

exports.bundle = function () {
  
  // Check if the file already exists
  fs.readFile(__dirname + '/public/js/bootstrap.js', 'utf8', function (err, data) {
    if (err) {
      
      // File doesn't exist.  Create it.
      var scripts = [
          'public/js/lib/bootstrap-transition.js'
        , 'public/js/lib/bootstrap-alert.js'
        , 'public/js/lib/bootstrap-modal.js'
        , 'public/js/lib/bootstrap-dropdown.js'
        , 'public/js/lib/bootstrap-scrollspy.js'
        , 'public/js/lib/bootstrap-tab.js'
        , 'public/js/lib/bootstrap-tooltip.js'
        , 'public/js/lib/bootstrap-popover.js'
        , 'public/js/lib/bootstrap-button.js'
        , 'public/js/lib/bootstrap-collapse.js'
        , 'public/js/lib/bootstrap-carousel.js'
        , 'public/js/lib/bootstrap-typeahead.js'
        , 'public/js/lib/bootstrap-affix.js'
      ];
      
      // 1: Concatenate and "minify" all the files
      var minified = UglifyJS.minify(scripts);

      // 2: Write out the result
      fs.writeFile(__dirname + '/public/js/bootstrap.js', minified.code, 'utf8', function (err) {
        if (err) {
          return console.log(err);
        }
        console.log('Writing bootstrap.js');
      });

    }
  console.log('bootstrap.js already exists.');
  });
}

/* =========================================================
 * CREATEPASSWORD: Generate a random password for password
 *                 resets.
 *
 * @return {string}
 *
 * Examples:
 *   utils.creatPassword()
 * ========================================================== */
exports.createPassword = function () {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz!@#$%^&*()";
    var string_length = 8;
    var randomstring = '';
    for (var i=0; i<string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum,rnum+1);
    }
    return randomstring;
}