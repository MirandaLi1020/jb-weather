const { logger } = require('../utils')
const { NotFoundError, InternalServerError, BadRequestError } = require('restify-errors')
const WeatherModelErrors = require('./weather-model-errors')
const debug = require('debug')('jb-weather:weather:weather-controller')

/**
 * Create a weather controller
 * @param {object} config Weather controller config
 * @return {object} A weather controller
 */
const createWeatherController = ({ weatherModel }) => {
  let weatherController

  if (weatherModel) { // Valid config provided
    /**
     * HTTP GET API for getting weather description
     * @param {object} req HTTP request
     * @param {object} res HTTP response
     * @param {object} next next middleware
     */
    const get = async (req, res, next) => {
      const { country, city } = req.params
      if (country && city) {
        let weatherDescription
        try {
          weatherDescription = await weatherModel.getWeatherDescriptionByCountryAndCity(country, city)
          debug('weatherDescription', weatherDescription)
        } catch (error) {
          // Handle weather model errors
          switch (error.message) {
            case WeatherModelErrors.NotFoundWeatherByCountryAndCityError:
              return next(new NotFoundError('Could not find weather'))
            case WeatherModelErrors.AccessDeniedError: // Normally access denied error should not happen, might be OpenWeatherMap API limit reached, retry might be success
            case WeatherModelErrors.PleaseRetryError:
              return next(new InternalServerError('Server error, please retry'))
            default:
              // Unhandled model errors, log and return NotFoundError
              logger.error(`weather-controller: unhandled model error: ${error}`)
              return next(new NotFoundError('Could not find weather'))
          }
        }
        if (weatherDescription) {
          // No cache
          res.noCache()
          // Send
          return res.send({
            weather: weatherDescription
          })
        } else {
          // Should not happen, just return NotFoundError
          return next(new NotFoundError('Could not find weather'))
        }
      } else {
        // Missing parameters
        return next(new BadRequestError('Missing parameter: country or city'))
      }
    }

    // Construct weatherController
    weatherController = {
      get: get
    }
  }

  return weatherController
}

module.exports = {
  create: createWeatherController
}
