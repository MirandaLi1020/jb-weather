const debug = require('debug')('jb-weather:weather:weather-model')
const { logger } = require('../utils')
const { NotFoundWeatherByCountryAndCityError, AccessDeniedError, PleaseRetryError } = require('./weather-model-errors')
const { SdkErrors } = require('../sdk')

/**
 * Create a weather model
 * @param {object} config Weather model config
 * @return {object} A weather model
 */
const createWeatherModel = ({ openWeatherMapSdk }) => {
  let weatherModel

  if (openWeatherMapSdk) { // Valid config provided
    /**
     * Get weather description from OpenWeatherMap SDK by country and city
     * @param {string} country Country name
     * @param {string} city City name
     * @return {Promise} Weather description as Promise
     */
    const getWeatherDescriptionByCountryAndCity = async (/* istanbul ignore next */ country = '', /* istanbul ignore next */ city = '') => {
      let weatherData
      try {
        weatherData = await openWeatherMapSdk.getWeatherByCountryAndCity(country, city)
        debug('weatherData', weatherData)
      } catch (error) {
        // SDK error handling
        switch (error.message) {
          case SdkErrors.NotFoundError:
            throw new Error(NotFoundWeatherByCountryAndCityError)
          case SdkErrors.UnauthorizedError:
            throw new Error(AccessDeniedError)
          case SdkErrors.RetryableError:
            throw new Error(PleaseRetryError)
          /* istanbul ignore next */
          default:
            // Unhandled sdk errors, log and return NotFoundWeatherByCountryAndCityError
            logger.error(`weather-model: unhandled sdk error: ${error}`)
            throw new Error(NotFoundWeatherByCountryAndCityError)
        }
      }

      // Return only weather description
      /* istanbul ignore else */
      if (weatherData && weatherData.weather && weatherData.weather[0] && weatherData.weather[0].description) {
        return weatherData.weather[0].description
      } else {
        // Missing data or unknown format handling
        throw new Error(NotFoundWeatherByCountryAndCityError)
      }
    }

    // Construct weatherModel
    weatherModel = {
      getWeatherDescriptionByCountryAndCity: getWeatherDescriptionByCountryAndCity
    }
  }

  return weatherModel
}

module.exports = {
  create: createWeatherModel
}
