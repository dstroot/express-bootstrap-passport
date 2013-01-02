'use strict'
/* ==============================================================
 *  Include required packages / Module Dependencies
 * ============================================================== */
var crypto          = require('crypto')
   ,UglifyJS        = require("uglify-js")        // https://npmjs.org/package/uglify-js
   ,fs              = require('fs');

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


/**
 * Concatentate and minify all the .js libraries
 *
 * Examples:
 *
 *   utils.bundle()
 */
exports.bundle = function () {
  
  // --- Check if the file already exists
  fs.readFile(__dirname + '/public/js/bootstrap.js', 'utf8', function (err, data) {
    if (err) {
      
      // --- File doesn't exist.  Create it.
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
      
      // 1: Minify all the files
      var minified = UglifyJS.minify(scripts);

      // 2: Write out the bundled, minified script
      fs.writeFile(__dirname + '/public/js/bootstrap.js', minified.code, 'utf8', function (err) {
        if (err) {
          return console.log(err);
        }
        console.log('Writing bootstrap.js');
      });

    }

  //console.log('bootstrap.js already exists.');
  
  });

}