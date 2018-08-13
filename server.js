const restify = require('restify')
const config = require('config')
const mongoose = require('mongoose')
const debug = require('debug')('jb-weather:server')

const { apiRateLimiter } = require('./utils')
const { OpenWeatherMapSdk } = require('./sdk')
const { WeatherModel, WeatherController } = require('./weather')

// Create restify server
const server = restify.createServer()

// Connect to mongodb
mongoose.connect(config.apiKeyRateLimiter.mongoUri, {
  useNewUrlParser: true,
  reconnectTries: config.apiKeyRateLimiter.mongoReconnectTries,
  reconnectInterval: config.apiKeyRateLimiter.mongoReconnectInterval
})

// Restify plugins
server.use(restify.plugins.acceptParser([
  'application/json'
]))
server.use(restify.plugins.authorizationParser())

// Create controllers
const openWeatherMapSdk = OpenWeatherMapSdk.create({
  apiHost: config.openWeatherMapApi.apiHost,
  apiKey: config.openWeatherMapApi.apiKey
})
if (openWeatherMapSdk) {
  const weatherModel = WeatherModel.create({ openWeatherMapSdk })
  if (weatherModel) {
    const weatherController = WeatherController.create({ weatherModel })
    if (weatherController) {
      // Register to router
      server.get('/weather/:country/:city', apiRateLimiter, weatherController.get)
      debug('GET /weather/:country/:city registered')
    }
  }
}

module.exports = server
