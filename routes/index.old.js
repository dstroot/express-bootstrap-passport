var fs              = require('fs')
  , path            = require('path')
  , config          = require('../config');

var options = [{
        "id": 1,
        "name": "foo",
        "votes": 30,
        "numbers": []
    },
    {
        "id": 2,
        "name": "bar",
        "votes": 20,
        "numbers": []
    },
    {
        "id": 3,
        "name": "baz",
        "votes": 10,
        "numbers": []
    }];

exports.index = function(req, res){
  res.render('index', {
    user: req.user,
  });
};

exports.poll = function(req, res){
  res.render('poll', {
    name: 'name', 
    shortname: 'shortname', 
    state: 'on',
    phonenumber: '9497775604', 
    voteoptions: JSON.stringify(options)
  });
};

exports.robots = function(req, res) {   
  fs.readFile(path.join(path.join(__dirname, '..'), '/public/robots.txt'), 'utf8', function(error, content) {
      if (error) console.log(error);
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end(content, 'utf-8');
  });
};

exports.humans = function(req, res) {   
  fs.readFile(path.join(path.join(__dirname, '..'), '/public/humans.txt'), 'utf8', function(error, content) {
      if (error) console.log(error);
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end(content, 'utf-8');
  });
};