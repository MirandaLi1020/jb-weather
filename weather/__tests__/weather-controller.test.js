/* globals describe, it */
/* eslint no-unused-expressions: 0 */

const chai = require('chai')
const expect = chai.expect
const httpMocks = require('node-mocks-http')
const sinon = require('sinon')
const { NotFoundError, InternalServerError, BadRequestError } = require('restify-errors')
const debug = require('debug')('jb-weather:weather:weather-controller:test')

const WeatherModelErrors = require('../weather-model-errors')

const WeatherController = require('../weather-controller')

const MOCK_VALID_COUNTRY = 'uk'
const MOCK_VALID_CITY = 'london'

const MOCK_INVALID_COUNTRY = 'uukk'
const MOCK_INVALID_CITY = 'lonlon'

const MOCK_TRIGGER_RETRYABLE_ERROR_COUNTRY = 'please_retry'
const MOCK_TRIGGER_RETRYABLE_ERROR_CITY = 'please_retry'

const mockWeatherModel = {
  getWeatherDescriptionByCountryAndCity: async (country, city) => {
    if (country === MOCK_VALID_COUNTRY && city === MOCK_VALID_CITY) {
      // Valid country + valid city returns weather description
      return 'few clouds'
    } else if (country === MOCK_INVALID_COUNTRY && city === MOCK_INVALID_CITY) {
      // Invalid country + invalid city returns error NotFoundWeatherByCountryAndCityError
      throw new Error(WeatherModelErrors.NotFoundWeatherByCountryAndCityError)
    } else if (country === MOCK_TRIGGER_RETRYABLE_ERROR_COUNTRY && MOCK_TRIGGER_RETRYABLE_ERROR_CITY) {
      // Simulate retryable errors
      throw new Error(WeatherModelErrors.PleaseRetryError)
    } else {
      throw new Error('Not implemented mockup')
    }
  }
}

describe('weather-controller tests', () => {
  describe('Module tests', () => {
    it('should have creating function create(config)', () => {
      expect(WeatherController.create, 'Im too lazy to write the function name').to.exist
    })
  })
  const validConfig = {
    weatherModel: mockWeatherModel
  }
  const invalidConfig = {
    weatherModel: undefined
  }

  describe('Creation function tests', () => {
    const weatherControllerToBeSuccessfullyCreated = WeatherController.create(validConfig)
    const weatherControllerToNotBeCreated = WeatherController.create(invalidConfig)

    it('should create a weather controller with valid config', () => {
      expect(weatherControllerToBeSuccessfullyCreated, 'Weather controller should be created').to.exist
    })
    it('should NOT create a weather controller with invalid config', () => {
      expect(weatherControllerToNotBeCreated, 'Weather controller should NOT be created').to.not.exist
    })
  })
  describe('function get(req, res, next) tests', () => {
    const weatherController = WeatherController.create(validConfig)

    const requestWithValidCountryAndCity = httpMocks.createRequest({
      method: 'GET',
      url: `/weather/${MOCK_VALID_COUNTRY}/${MOCK_VALID_CITY}`,
      params: {
        country: MOCK_VALID_COUNTRY,
        city: MOCK_VALID_CITY
      }
    })
    const responseForRequestWithValidCountryAndCity = httpMocks.createResponse()

    const requestWithInvalidCountryAndCity = httpMocks.createRequest({
      method: 'GET',
      url: `/weather/${MOCK_INVALID_COUNTRY}/${MOCK_INVALID_CITY}`,
      params: {
        country: MOCK_INVALID_COUNTRY,
        city: MOCK_INVALID_CITY
      }
    })
    const responseForRequestWithInvalidCountryAndCity = httpMocks.createResponse()

    const requestWithMissingParameters = httpMocks.createRequest({
      method: 'GET',
      url: `/weather/${MOCK_VALID_COUNTRY}/`,
      params: {
        country: MOCK_VALID_COUNTRY,
        city: undefined
      }
    })
    const responseForRequestWithMissingParameters = httpMocks.createResponse()

    const requestToTriggerServerError = httpMocks.createRequest({
      method: 'GET',
      url: `/weather/${MOCK_TRIGGER_RETRYABLE_ERROR_COUNTRY}/${MOCK_TRIGGER_RETRYABLE_ERROR_CITY}`,
      params: {
        country: MOCK_TRIGGER_RETRYABLE_ERROR_COUNTRY,
        city: MOCK_TRIGGER_RETRYABLE_ERROR_CITY
      }
    })
    const responseForRequestToTriggerServerError = httpMocks.createResponse()

    it('should have function get', () => {
      expect(weatherController.get, 'function get should exist').to.exist
    })
    it('should return weather data for valid country and city', async () => {
      try {
        const spiedNext = sinon.spy()
        await weatherController.get(requestWithValidCountryAndCity, responseForRequestWithValidCountryAndCity, spiedNext)
        debug('responseForRequestWithValidCountryAndCity', responseForRequestWithValidCountryAndCity)
        const statusCode = responseForRequestWithValidCountryAndCity.statusCode
        const body = responseForRequestWithValidCountryAndCity._getData()

        expect(statusCode, 'status code should be 200').to.equal(200)
        expect(body, 'should have body').to.exist
        expect(body.weather, 'should have weather as few clouds').to.equal('few clouds')
        expect(spiedNext.called, 'next should NOT be called').to.be.false
      } catch (error) {
        expect(error, 'should NOT have any error').to.not.exist
      }
    })
    it('should return NotFoundError for unknown country and city', async () => {
      try {
        const spiedNext = sinon.spy()
        await weatherController.get(requestWithInvalidCountryAndCity, responseForRequestWithInvalidCountryAndCity, spiedNext)
        const nextCalledWith = spiedNext.args[0]
        debug('nextCalledWith', nextCalledWith)

        expect(spiedNext.called, 'next should be called').to.be.true
        expect(nextCalledWith.name === NotFoundError.name, 'should call next with NotFoundError error').to.be.true
      } catch (error) {
        expect(error, 'should NOT have any error').to.not.exist
      }
    })
    it('should return BadRequestError for missing paramters', async () => {
      try {
        const spiedNext = sinon.spy()
        await weatherController.get(requestWithMissingParameters, responseForRequestWithMissingParameters, spiedNext)
        const nextCalledWith = spiedNext.args[0]
        debug('nextCalledWith', nextCalledWith)

        expect(spiedNext.called, 'next should be called').to.be.true
        expect(nextCalledWith.name === BadRequestError.name, 'should call next with BadRequestError error').to.be.true
      } catch (error) {
        expect(error, 'should NOT have any error').to.not.exist
      }
    })
    it('should return InternalServerError for missing paramters', async () => {
      try {
        const spiedNext = sinon.spy()
        await weatherController.get(requestToTriggerServerError, responseForRequestToTriggerServerError, spiedNext)
        const nextCalledWith = spiedNext.args[0]
        debug('nextCalledWith', nextCalledWith)

        expect(spiedNext.called, 'next should be called').to.be.true
        expect(nextCalledWith.name === InternalServerError.name, 'should call next with InternalServerError error').to.be.true
      } catch (error) {
        expect(error, 'should NOT have any error').to.not.exist
      }
    })
  })
})
