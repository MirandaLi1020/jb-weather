/* globals describe, it */
/* eslint no-unused-expressions: 0 */

const chai = require('chai')
const expect = chai.expect
const config = require('config')
const debug = require('debug')('jb-weather:sdk:open-weather-map-sdk:test')

const OpenWeatherMapSdk = require('./open-weather-map-sdk')
const SdkConstants = require('./sdk-constants')
const SdkErrors = require('./sdk-errors')

// Mockups
const { apiHost: VALID_API_HOST, apiKey: VALID_API_KEY } = config.openWeatherMapApi
debug('VALID_API_HOST', VALID_API_HOST)
debug('VALID_API_KEY', VALID_API_KEY)

const INVALID_API_HOST = ''
const INVALID_API_KEY = 'INVALID_API_KEY'

/**
 * Create a fake Fetch response for mock up
 * @param {boolean} ok Is response OK
 * @param {number} status Status code
 * @param {object} json Response body as JSON
 * @param {string} text Response body as text
 * @return {Promise} A Fetch response
 */
const createFetchMockResponse = async (ok = false, status = 500, json, text) => {
  const response = {
    ok: ok,
    status: status
  }
  if (json) {
    response.json = async json => {
      return json
    }
  }
  if (text) {
    response.text = async text => {
      return text
    }
  }
  return response
}

const MOCK_VALID_COUNTRY = 'uk'
const MOCK_VALID_CITY = 'london'

const MOCK_INVALID_COUNTRY = 'uukk'
const MOCK_INVALID_CITY = 'lonlon'

const MOCK_TRIGGER_SERVER_ERROR_COUNTRY = 'server_error'
const MOCK_TRIGGER_SERVER_ERROR_CITY = 'server_error'

const MOCK_VALID_JSON_RESULT = { 'coord': { 'lon': -0.13, 'lat': 51.51 }, 'weather': [{ 'id': 300, 'main': 'Drizzle', 'description': 'light intensity drizzle', 'icon': '09d' }], 'base': 'stations', 'main': { 'temp': 280.32, 'pressure': 1012, 'humidity': 81, 'temp_min': 279.15, 'temp_max': 281.15 }, 'visibility': 10000, 'wind': { 'speed': 4.1, 'deg': 80 }, 'clouds': { 'all': 90 }, 'dt': 1485789600, 'sys': { 'type': 1, 'id': 5091, 'message': 0.0103, 'country': 'GB', 'sunrise': 1485762037, 'sunset': 1485794875 }, 'id': 2643743, 'name': 'London', 'cod': 200 }
const mockValidResponse = createFetchMockResponse(true, 200, MOCK_VALID_JSON_RESULT)

const MOCK_INVALID_API_KEY_JSON_RESULT = { 'cod': 401, 'message': 'Invalid API key. Please see http://openweathermap.org/faq#error401 for more info.' }
const mockInvalidApiKeyResponse = createFetchMockResponse(false, 401, MOCK_INVALID_API_KEY_JSON_RESULT)

const MOCK_CITY_NOT_FOUND_JSON_RESULT = { 'cod': '404', 'message': 'city not found' }
const mockNotFoundResponse = createFetchMockResponse(false, 404, MOCK_CITY_NOT_FOUND_JSON_RESULT)

const mockServerErrorResponse = createFetchMockResponse(false, 500)

const mockFetchLib = async (url) => {
  switch (url) {
    // Valid api key + valid country + valid city
    case `${VALID_API_HOST}${SdkConstants.WEATHER_API_PATH}?${SdkConstants.WEATHER_API_QUERY_BY_CITY_NAME}=${MOCK_VALID_CITY},${MOCK_VALID_COUNTRY}&${SdkConstants.WEATHER_API_QUERY_API_KEY}=${VALID_API_KEY}`:
      return mockValidResponse
    // Invalid api key + valid country + valid city
    case `${VALID_API_HOST}${SdkConstants.WEATHER_API_PATH}?${SdkConstants.WEATHER_API_QUERY_BY_CITY_NAME}=${MOCK_VALID_CITY},${MOCK_VALID_COUNTRY}&${SdkConstants.WEATHER_API_QUERY_API_KEY}=${INVALID_API_KEY}`:
      return mockInvalidApiKeyResponse
    // Valid api key + invalid country + invalid city
    case `${VALID_API_HOST}${SdkConstants.WEATHER_API_PATH}?${SdkConstants.WEATHER_API_QUERY_BY_CITY_NAME}=${MOCK_INVALID_CITY},${MOCK_INVALID_COUNTRY}&${SdkConstants.WEATHER_API_QUERY_API_KEY}=${VALID_API_KEY}`:
      return mockNotFoundResponse
    // This URL will trigger a server error response
    case `${VALID_API_HOST}${SdkConstants.WEATHER_API_PATH}?${SdkConstants.WEATHER_API_QUERY_BY_CITY_NAME}=${MOCK_TRIGGER_SERVER_ERROR_CITY},${MOCK_TRIGGER_SERVER_ERROR_COUNTRY}&${SdkConstants.WEATHER_API_QUERY_API_KEY}=${VALID_API_KEY}`:
      return mockServerErrorResponse
    default:
      throw new Error('Not implemented mockup')
  }
}

describe('open-weather-map-sdk tests', () => {
  describe('Module tests', () => {
    it('should have creating function create(config)', () => {
      expect(OpenWeatherMapSdk.create, 'Im too lazy to write the function name').to.exist
    })
  })
  const validConfig = {
    apiHost: VALID_API_HOST,
    apiKey: VALID_API_KEY,
    fetchLib: mockFetchLib
  }
  const invalidConfigWithInvalidHost = {
    apiHost: INVALID_API_HOST,
    apiKey: VALID_API_KEY,
    fetchLib: mockFetchLib
  }
  const invalidConfigWithInvalidApiKey = {
    apiHost: VALID_API_HOST,
    apiKey: INVALID_API_KEY,
    fetchLib: mockFetchLib
  }
  describe('Creation function tests', () => {
    const openWeatherMapSdkToBeSuccessfullyCreated = OpenWeatherMapSdk.create(validConfig)
    const openWeatherMapSdkToNotBeCreated = OpenWeatherMapSdk.create(invalidConfigWithInvalidHost)

    it('should create a Sdk with valid config', () => {
      expect(openWeatherMapSdkToBeSuccessfullyCreated, 'Sdk should be created').to.exist
    })
    it('should NOT create a Sdk with invalid config', () => {
      expect(openWeatherMapSdkToNotBeCreated, 'Sdk should NOT be created').to.not.exist
    })
  })
  describe('function getWeatherByCountryAndCity(country, city) tests', () => {
    const openWeatherMapSdk = OpenWeatherMapSdk.create(validConfig)
    const openWeatherMapSdkWithInvalidApiKey = OpenWeatherMapSdk.create(invalidConfigWithInvalidApiKey)

    it('should have function getWeatherByCountryAndCity', () => {
      expect(openWeatherMapSdk.getWeatherByCountryAndCity, 'function getWeatherByCountryAndCity should exist').to.exist
    })
    it('should return weather result for valid country and city', async () => {
      try {
        const result = await openWeatherMapSdk.getWeatherByCountryAndCity(MOCK_VALID_COUNTRY, MOCK_VALID_CITY)
        debug('result', result)
        expect(result, 'should have a result').to.exist
        expect(result.weather[0].description, 'should have weather description as few clouds').to.equal('few clouds')
      } catch (error) {
        expect(error, 'should NOT have any error').to.not.exist
      }
    })
    it('should return NotFoundError for invalid country and city name', async () => {
      try {
        const result = await openWeatherMapSdk.getWeatherByCountryAndCity(MOCK_INVALID_COUNTRY, MOCK_INVALID_CITY)
        expect(result, 'should NOT have any result').to.not.exist
      } catch (error) {
        debug('error', error)
        expect(error.message, 'should return NotFoundError').to.equal(SdkErrors.NotFoundError)
      }
    })
    it('should return RetryableError for 500 response status', async () => {
      try {
        const result = await openWeatherMapSdk.getWeatherByCountryAndCity(MOCK_TRIGGER_SERVER_ERROR_COUNTRY, MOCK_TRIGGER_SERVER_ERROR_CITY)
        expect(result, 'should NOT have any result').to.not.exist
      } catch (error) {
        debug('error', error)
        expect(error.message, 'should return RetryableError').to.equal(SdkErrors.RetryableError)
      }
    })
    it('should return UnauthorizedError for invalid API key', async () => {
      try {
        const result = await openWeatherMapSdkWithInvalidApiKey.getWeatherByCountryAndCity(MOCK_VALID_COUNTRY, MOCK_VALID_CITY)
        expect(result, 'should NOT have any result').to.not.exist
      } catch (error) {
        debug('error', error)
        expect(error.message, 'should return UnauthorizedError').to.equal(SdkErrors.UnauthorizedError)
      }
    })
  })
})
