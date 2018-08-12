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

# How API Rate Limiter Works

* All HTTP requests to Weather API endpoint must have a HTTP Basic Auth header
  * Username: A valid API Key
  * Password: anything, e.g. "x"
* We are uring `restify` as API server framework
  * `restify` has a plugin that can decode HTTP Basic Auth header to `username` and `password`
* Limiter will verify `username` as API key
* Limiter will try to get `usage` data for matching API key from `mongodb` database
  * `mongodb` database has a feature of automatically removing entities after xxx seconds
  * If found `usage` data in database and it is bigger than allowed, return `TooManyRequestsError`
* All responses will have following information in headers
  * `X-RateLimit-Limit` | The maximum number of requests you're permitted to make per limit window.
  * `X-RateLimit-Remaining` | The number of requests remaining in the current rate limit window.
  * `X-RateLimit-Reset` | The time at which the current rate limit window resets in UTC epoch seconds.

# How to Test

JS Lint using standard
```
npm run lint
```

To make sure "**That Story**" never happen again (I can tell a story about what happened to unit tests with mockup mongodb)
We will need a real mongodb server running before runing unit tests

Luckly we have docker. To run a mongodb server on localhost at 27017 port

```
docker run --name mongo_jb_weather -d -p 27017:27017 mongo:3.6
```

To stop mongodb server

```
docker stop mongo_jb_weather
```

To start stopped mongodb server again

```
docker start mongo_jb_weather
```

After mongodb server running, then test using mocha
```
npm test
```

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
