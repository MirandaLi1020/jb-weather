const _fetch = require('node-fetch')
const debug = require('debug')('jb-weather:sdk:open-weather-map-sdk')
const { logger } = require('../utils')
const { WEATHER_API_PATH, WEATHER_API_QUERY_BY_CITY_NAME, WEATHER_API_QUERY_API_KEY, WEATHER_API_HTTP_HEADERS } = require('./sdk-constants')
const { NotFoundError, UnauthorizedError, RetryableError } = require('./sdk-errors')

/**
 * Create a OpenWeatherMapSdk
 * @param {object} config SDK config
 * @return {object} A OpenWeatherMapSdk
 */
const createOpenWeatherMapSdk = ({ apiHost, apiKey, fetchLib }) => {
  let openWeatherMapSdk

  if (apiHost && apiKey) { // Valid config provided
    /* istanbul ignore if */
    if (!fetchLib) {
      // No mockup fetch lib provided, use real one
      fetchLib = _fetch
    }
    /**
     * GET Weather data from OpenWeatherMap API
     * @param {string} country Country name
     * @param {string} city City name
     * @return {Promise} Weather data as Promise
     */
    const getWeatherByCountryAndCity = async (/* istanbul ignore next */ country = '', /* istanbul ignore next */ city = '') => {
      const uri = encodeURI(`${apiHost}${WEATHER_API_PATH}?${WEATHER_API_QUERY_BY_CITY_NAME}=${city.toLowerCase()},${country.toLowerCase()}&${WEATHER_API_QUERY_API_KEY}=${apiKey}`)
      debug('uri', uri)

      let response
      try {
        response = await fetchLib(uri, {
          headers: WEATHER_API_HTTP_HEADERS
        })
        /* istanbul ignore if */
        if (!response) {
          throw new Error('Unsuccess HTTP call')
        }
      } catch (error) {
        // Network related error, log them and throw retryable error
        /* istanbul ignore next */
        logger.error(`open-weather-map-sdk: network error: ${error}`)
        /* istanbul ignore next */
        throw new Error(RetryableError)
      }

      const statusOk = response.ok
      const statusCode = response.status
      debug('statusOk', statusOk)
      debug('statusCode', statusCode)

      if (statusOk) {
        let weatherData
        try {
          weatherData = await response.json()
          debug('weatherData', weatherData)

          return weatherData
        } catch (error) {
          // Could not get JSON data, log them and return NotFoundError
          /* istanbul ignore next */
          logger.error(`open-weather-map-sdk: could not get JSON`)
          /* istanbul ignore next */
          throw new Error(NotFoundError)
        }
      } else {
        // Status code handling
        /* istanbul ignore else */
        if (statusCode === 404) {
          throw new Error(NotFoundError)
        } else if (statusCode >= 500) {
          throw new Error(RetryableError)
        } else if (statusCode === 401 || /* istanbul ignore next */ statusCode === 403 || /* istanbul ignore next */ statusCode === 429) {
          throw new Error(UnauthorizedError)
        } else {
          // Unknown errors, log them and return NotFoundError
          logger.error(`open-weather-map-sdk: unhandled status code: ${statusCode}`)
          throw new Error(NotFoundError)
        }
      }
    }

    // Construct openWeatherMapSdk
    openWeatherMapSdk = {
      getWeatherByCountryAndCity: getWeatherByCountryAndCity
    }
  }

  return openWeatherMapSdk
}

module.exports = {
  create: createOpenWeatherMapSdk
}
