# [Express + Bootstrap + Passport](https://github.com/dstroot/express-bootstrap-passport)

### [Bootstrap 2.2.2](http://twitter.github.com/bootstrap/) and [Express 3.0.5](http://expressjs.com/) using [Jade](https://github.com/visionmedia/jade) templates, and [Passport](https://github.com/jaredhanson/passport) authentication.  We also use a few very helpful modules:
- **less-middeware**
- **cradle**
- **uglify-js**
- **crypto**


## About this project

I needed a basic "starter kit" for Node.  I like Expressjs, but was not familiar with Jade and wanted to learn it for templating.  I also wanted a little continous integration so by using less middleware we will recompile the Less code "automagically" for us.  In this way both Less and Jade code can be changed with the applciation running and the changes will be imemdiately reflected.  Probably not best for production.  ;)

Finally I wanted the ability to setup users. log them in and log them out. I chose Passport over Everyauth.  I also wanted the users persisted in a database.  Jared Hanson's Express 3 example misses the all important "register a new user" step so I wanted to build that out. In short, I wanted a fully operational launch point for an Express 3 project with working local authentication.

My longer term goal is to add facebook and twitter strategies but local will almost always be needed and it's a good starting point.


## Prerequisites

You will need to have both node and git installed on your development system.

You will also need a working couchDB implementation.  The easiest way to start is to sign up for a free account with either:
- [Cloudant](https://cloudant.com/)
- [Iris Couch](http://www.iriscouch.com/)

All you need is your:
+ Server Path:		'https://somebody.cloudant.com'
+ UserID:			'somebody'
+ Password:			'passw0rd'

When the application starts it will create a "users" database for you, then add a view so you can query it, plus insert a test user.  In short when you fire it up it should "just work". 

## Quickstart

* Clone the repo: `git clone git@github.com:dstroot/express-bootstrap-passport.git && cd express-boot*`
* install the dependencies: `sudo npm install`
* rename config-example.js to config.js `cp config-example.js config.js` and tweak it with your couchDB settings
* run the app: `node app`

## Bug tracker

Have a bug or a feature request? [Please open a new issue](https://github.com/twitter/bootstrap/issues). Before opening any issue, please search for existing issues and read the [Issue Guidelines](https://github.com/necolas/issue-guidelines), written by [Nicolas Gallagher](https://github.com/necolas/).

## Community

Keep track of development and community news.

* Follow [@twbootstrap on Twitter](http://twitter.com/twbootstrap).
* Read and subscribe to the [The Official Twitter Bootstrap Blog](http://blog.getbootstrap.com).
* Have a question that's not a feature request or bug report? [Ask on the mailing list.](http://groups.google.com/group/twitter-bootstrap)
* Chat with fellow Bootstrappers in IRC. On the `irc.freenode.net` server, in the `##twitter-bootstrap` channel.

## Contributing

* Please submit all pull requests against *-wip branches. 
* If your pull request contains JavaScript patches or features, you must include relevant unit tests. 
* If we are going to use Bootstrap then I suppose HTML and CSS should conform to the [Code Guide](http://github.com/mdo/code-guide), maintained by [Mark Otto](http://github.com/mdo).

Thanks!

## Authors

**Dan Stroot**

+ http://twitter.com/mdo
+ http://github.com/mdo

## Copyright and license

Copyright 2012 Twitter, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this work except in compliance with the License.
You may obtain a copy of the License in the LICENSE file, or at:

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.


## Changelog:

#### v.0.1 : Initial commit - December 29th, 2012


### Upgrading Bootstrap:
- Copy the Bootstrap Less files to a directory under root project directory: /less.   

	*Note the system will use less-middleware to "automagically" compile them by reading the css asked for in the html!*

- Copy the Bootstrap assets /docs/assets/* into /public.  

	*This grabs all the icons, images, js, etc.*

- move the contents of public/js to public/js/lib.  

	*I like to keep libraries separated from my code. This system will concatenate and minify the libs using uglify-js.*

- If you are doing a big bump such as 2.x to 3.x you will also need to play with the Jade templates to match up.
