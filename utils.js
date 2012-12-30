'use strict'
/* ==============================================================
    Include required packages / Module Dependencies
=============================================================== */
var crypto          = require('crypto');

exports.smsify = function(str) {
  if (str.length <= 160) { return str; }
  else { return str.substr(0,157)+'...'; }
};

exports.initcap = function(str) {
  return str.substring(0,1).toUpperCase() + str.substring(1);
};

exports.testint = function(str) {
  var intRegex = /^\d+$/;
  if(intRegex.test(str)) {
    return true;
  }
  return false;
};

exports.formatPhone = function(phonenum) {
    var regexObj = /^(?:\+?1[-. ]?)?(?:\(?([0-9]{3})\)?[-. ]?)?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (regexObj.test(phonenum)) {
        var parts = phonenum.match(regexObj);
        var phone = "";
        if (parts[1]) { phone += "(" + parts[1] + ") "; }
        phone += parts[2] + "-" + parts[3];
        return phone;
    }
    else {
        //invalid phone number
        return phonenum;
    }
};

exports.hash = function (pass, salt) {
  var h = crypto.createHash('sha512');
  h.update(pass);
  h.update(salt);
  return h.digest('base64');
};