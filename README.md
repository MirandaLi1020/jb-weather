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

# How to test

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

Integration test for whole server, only for development, do NOT use this test in CI/CD
```
npm run integration-test
```

# How to generate and view test coverage report

Generate report
```
npm run test-cover
```

Serve report on http://localhost:8100
```
npm run coverage-http
```

# How to start a server

To run a mongodb server on localhost at 27017 port

```
docker run --name mongo_jb_weather -d -p 27017:27017 mongo:3.6
```

After mongodb server running

```
npm start
```

# How to use

Grap a valid API key below

```
27f01d68e204427fbeb7c0dff06c7e94
0666075f3b66492995cd7769e92a0af4
f8cc06f9d83f40eeb0b2ce79d47b71ab
6c691d392ccf48fa82e39f263409ac3e
e61b51f45fdd484f9b67b88dc344fabd
```

Send a GET request to server in following format

```
GET http://localhost:8080/weather/{Country}/{City}
```

With `HTTP Basic Authorization` header, use API key as username, `x` as password

```
Authorization: Basic ****
```

CURL Samples

```
curl -i -u 27f01d68e204427fbeb7c0dff06c7e94:x http://localhost:8080/weather/australia/melbourne
```

You should get a result

```
{ "weather": "sunny then rain then strom then sunny again" }
```

# Environment variables for deployment

* `OPEN_WEATHER_API_HOST`
* `OPEN_WEATHER_API_KEY`
* `LOGGER_LEVEL`
* `API_KEY_LIMITER_LIMIT`
* `API_KEY_LIMITER_UNIT_SECOND`
* `API_KEY_LIMITER_MONGO_URI`
* `SERVER_PORT`

# Project Files

* [JBHi-Fi_Nodejs_Challenge.pdf](./JBHi-Fi_Nodejs_Challenge.pdf) | JB Hi-Fi Node.js programming challenge
* [README.md](./README.md) | This file
* [package.json](./package.json)
* [.gitignore](./.gitignore) | https://github.com/github/gitignore/blob/master/Node.gitignore
* [server.js](./server.js) | Restify server
* [index.js](./index.js) | App startup file
* `/test`
  * [unit-tests.opts](./test/unit-tests.opts) | Mocha configuration file for unit tests
* `/config`
  * [default.js](./config/default.js) | Default configuration file
  * [test.js](./config/test.js) | configuration for tests
* `/sdk`
  * [index.js](./sdk/index.js)
  * [sdk-constants.js](./sdk/sdk-constants.js)
  * [sdk-errors.js](./sdk/sdk-errors.js)
  * [open-weather-map-sdk.js](./sdk/open-weather-map-sdk.js) | Open Weather Map SDK
  * `/__tests__`
    * [open-weather-map-sdk.test.js](./sdk/__tests__/open-weather-map-sdk.test.js)
* `/utils` | Utilities components
  * [index.js](./utils/index.js)
  * [logger.js](./utils/logger.js) | Logger using winston
  * [constants.js](./utils/constants.js)
  * [api-keys.js](./utils/api-keys.js) | Pre loaded API keys
  * [api-key-usage-model.js](./utils/api-key-usage-model.js) | Mongoose model for API kay usage
  * [api-rate-limiter.js](./utils/api-rate-limiter.js) | API rate limiter middleware
  * `/__tests__`
    * [api-rate-limiter.test.js](./utils/__tests__/api-rate-limiter.test.js)
* `/weather` | Weather component folder
  * [index.js](./weather/index.js)
  * [weather-model-errors.js](./weather/weather-model-errors.js)
  * [weather-model.js](./weather/weather-model.js) | Model for weather component
  * [weather-controller.js](./weather/weather-controller.js) | API Controller for weather component
  * `__tests__`
    * [weather-model.test.js](./weather/__tests__/weather-model.test.js)
    * [weather-controller.test.js](./weather/__tests__/weather-controller.test.js)

# Credits

* `mocha` https://github.com/mochajs/mocha
* `chai` https://github.com/chaijs/chai
* `standard` https://github.com/standard/standard
* `config` https://github.com/lorenwest/node-config
* `debug` https://github.com/visionmedia/debug
* `mongoose` http://http://mongoosejs.com/
* `restify` https://http://restify.com/
* `node-fetch` https://github.com/bitinn/node-fetch
* `node-mocks-http` https://github.com/howardabrams/node-mocks-http
* `sinon` https://sinonjs.org/
* `supertest` https://github.com/visionmedia/supertest