#  NodeJS and Boostrap 2.2.2 and Express 3.0.5 with Jade Templating, and Passport Authentication AKA "the full monte".  ;)

## This project was to setup a "real" vanilla express 3 build environment with the default Jade template engine and {less} compiling, etc.  In short, a fully operational launch point for an express 3 project.

## Prerequisites

I assume you have both node and git installed on your development system. Then:

- clone the repo
- install the dependencies: $sudo npm install
- rename config-example.js to config.js and tweak
- run the app: $node app

Dropping in Bootstrap:
- Copy the less files to a directory under root project directory: /less

Note the system will use less-middleware to "automagically" compile them by reading the css asked for in the html!

- copy /docs/assets/* into /public

This grabs all the icons, images, js, etc.

- move the contents of public/js to public/js/lib

I like to keep libraries separated from my code. This system will concatenate and minify the libs using uglify-js.


## Changelog:

### v.0.1 : Initial commit - December 29th, 2012
