/* globals describe, it */
/* eslint no-unused-expressions: 0 */

const chai = require('chai')
const expect = chai.expect
const debug = require('debug')('jb-weather:weather:weather-model:test')

const { SdkErrors } = require('../../sdk')

const WeatherModel = require('../weather-model')
const WeatherModelErrors = require('../weather-model-errors')

const MOCK_VALID_COUNTRY = 'uk'
const MOCK_VALID_CITY = 'london'

const MOCK_INVALID_COUNTRY = 'uukk'
const MOCK_INVALID_CITY = 'lonlon'

const MOCK_TRIGGER_SERVER_ERROR_COUNTRY = 'server_error'
const MOCK_TRIGGER_SERVER_ERROR_CITY = 'server_error'

const MOCK_TRIGGER_INVALID_API_KEY_ERROR_COUNTRY = 'invalid_api_key'
const MOCK_TRIGGER_INVALID_API_KEY_ERROR_CITY = 'invalid_api_key'

const mockOpenWeatherMapSdk = {
  getWeatherByCountryAndCity: async (country, city) => {
    if (country === MOCK_VALID_COUNTRY && city === MOCK_VALID_CITY) {
      // Valid country + valid city returns weather data
      return { 'coord': { 'lon': -0.13, 'lat': 51.51 }, 'weather': [{ 'id': 300, 'main': 'Drizzle', 'description': 'light intensity drizzle', 'icon': '09d' }], 'base': 'stations', 'main': { 'temp': 280.32, 'pressure': 1012, 'humidity': 81, 'temp_min': 279.15, 'temp_max': 281.15 }, 'visibility': 10000, 'wind': { 'speed': 4.1, 'deg': 80 }, 'clouds': { 'all': 90 }, 'dt': 1485789600, 'sys': { 'type': 1, 'id': 5091, 'message': 0.0103, 'country': 'GB', 'sunrise': 1485762037, 'sunset': 1485794875 }, 'id': 2643743, 'name': 'London', 'cod': 200 }
    } else if (country === MOCK_INVALID_COUNTRY && city === MOCK_INVALID_CITY) {
      // Invalid country + invalid city returns error SdkErrors.NotFoundError
      throw new Error(SdkErrors.NotFoundError)
    } else if (country === MOCK_TRIGGER_SERVER_ERROR_COUNTRY && city === MOCK_TRIGGER_SERVER_ERROR_CITY) {
      // Simulate server errors from Open Weather Map API
      throw new Error(SdkErrors.RetryableError)
    } else if (country === MOCK_TRIGGER_INVALID_API_KEY_ERROR_COUNTRY && city === MOCK_TRIGGER_INVALID_API_KEY_ERROR_CITY) {
      // Simulate invalid API key or API key over limit errors from Open Weather Map API
      throw new Error(SdkErrors.UnauthorizedError)
    } else {
      throw new Error('Not implemented mockup')
    }
  }
}

describe('weather-model tests', () => {
  describe('Module tests', () => {
    it('should have creating function create(config)', () => {
      expect(WeatherModel.create, 'Im too lazy to write the function name').to.exist
    })
  })
  const validConfig = {
    openWatherMapSdk: mockOpenWeatherMapSdk
  }
  const invalidConfig = {
    openWatherMapSdk: undefined
  }
  describe('Creation function tests', () => {
    const weatherModelToBeSuccessfullyCreated = WeatherModel.create(validConfig)
    const weatherModelToNotBeCreated = WeatherModel.create(invalidConfig)

    it('should create a weather model with valid config', () => {
      expect(weatherModelToBeSuccessfullyCreated, 'Weather model should be created').to.exist
    })
    it('should NOT create a weather model with invalid config', () => {
      expect(weatherModelToNotBeCreated, 'Weather model should NOT be created').to.not.exist
    })
  })
  describe('function getWeatherDescriptionByCountryAndCity(country, city) tests', () => {
    const weatherModel = WeatherModel.create(validConfig)

    it('should have function getWeatherDescriptionByCountryAndCity', () => {
      expect(weatherModel.getWeatherDescriptionByCountryAndCity, 'function getWeatherDescriptionByCountryAndCity should exist').to.exist
    })
    it('should return weather description text for valid country and city', async () => {
      const result = await weatherModel.getWeatherDescriptionByCountryAndCity(MOCK_VALID_COUNTRY, MOCK_VALID_CITY)
      debug('result', result)
      expect(result, 'should have a result').to.exist
      expect(result, 'result should be "light intensity drizzle"').to.equal('light intensity drizzle')
    })
    it('should return NotFoundWeatherByCountryAndCityError for invalid country and city name', async () => {
      try {
        const result = await weatherModel.getWeatherDescriptionByCountryAndCity(MOCK_INVALID_COUNTRY, MOCK_INVALID_CITY)
        expect(result, 'should NOT have any result').to.not.exist
      } catch (error) {
        debug('error', error)
        expect(error.message, 'should return NotFoundWeatherByCountryAndCityError').to.equal(WeatherModelErrors.NotFoundWeatherByCountryAndCityError)
      }
    })
    it('should return PleaseRetryError for server errors from Open Weather Map API', async () => {
      try {
        const result = await weatherModel.getWeatherDescriptionByCountryAndCity(MOCK_TRIGGER_SERVER_ERROR_COUNTRY, MOCK_TRIGGER_SERVER_ERROR_CITY)
        expect(result, 'should NOT have any result').to.not.exist
      } catch (error) {
        debug('error', error)
        expect(error.message, 'should return PleaseRetryError').to.equal(WeatherModelErrors.PleaseRetryError)
      }
    })
    it('should return AccessDeniedError for invalid API key or over limit errors from Open Weahter Map API', async () => {
      try {
        const result = await weatherModel.getWeatherDescriptionByCountryAndCity(MOCK_TRIGGER_INVALID_API_KEY_ERROR_COUNTRY, MOCK_TRIGGER_INVALID_API_KEY_ERROR_CITY)
        expect(result, 'should NOT have any result').to.not.exist
      } catch (error) {
        debug('error', error)
        expect(error.message, 'should return AccessDeniedError').to.equal(WeatherModelErrors.AccessDeniedError)
      }
    })
  })
})
