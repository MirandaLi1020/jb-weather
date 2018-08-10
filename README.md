# JB Weather
**A project for "JB Hi-Fi Node.js programming challenge"**

# Application Design Highlights

This application has 3 components
* A RESTfull API server
  * Stateless and scalable
  * Accept and return standard HTTP requests/responses
* A HTTP request throttle middleware for the server.
  * Limitted to 5 requests to weather report API per hour per API key
  * Return rate limiting data as HTTP header https://developer.github.com/v3/#rate-limiting
* A function to consume OpenWeatherMap API and return weather description to client

# Project Files

* `JBHi-Fi_Nodejs_Challenge.pdf` | JB Hi-Fi Node.js programming challenge
* `README.md` | This file
* `package.json`
* `.gitignore` | https://github.com/github/gitignore/blob/master/Node.gitignore
* `/test`
  * `unit-tests.opts` | Mocha configuration file for unit tests
* `/config`
  * `default.js` | Default configuration file
  * `test.js` | configuration for tests

# Credits

* `mocha` https://github.com/mochajs/mocha
* `chai` https://github.com/chaijs/chai
* `standard` https://github.com/standard/standard
* `config` https://github.com/lorenwest/node-config
* `debug` https://github.com/visionmedia/debug
