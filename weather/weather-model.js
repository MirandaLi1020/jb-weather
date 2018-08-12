const debug = require('debug')('jb-weather:weather:weather-model')
const { logger } = require('../utils')
const WeatherModelErrors = require('./weather-model-errors')
const { NotFoundWeatherByCountryAndCityError, AccessDeniedError, PleaseRetryError } = WeatherModelErrors
const { SdkErrors } = require('../sdk')

/**
 * Create a weather model
 * @param {object} config Weather model config
 * @return {object} A weather model
 */
const createWeatherModel = ({ openWatherMapSdk }) => {
  let weatherModel

  if (openWatherMapSdk) { // Valid config provided
    /**
     * Get weather description from OpenWeatherMap SDK by country and city
     * @param {string} country Country name
     * @param {string} city City name
     * @return {Promise} Weather description as Promise
     */
    const getWeatherDescriptionByCountryAndCity = async (country = '', city = '') => {
      let weatherData
      try {
        weatherData = await openWatherMapSdk.getWeatherByCountryAndCity(country, city)
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
          default:
            // Unhandled sdk errors, log and return NotFoundWeatherByCountryAndCityError
            logger.error(`weather-model: unhandled sdk error: ${error}`)
            throw new Error(NotFoundWeatherByCountryAndCityError)
        }
      }

      // Return only weather description
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
