/* globals describe, it, before after */
/* eslint no-unused-expressions: 0 */

const chai = require('chai')
const expect = chai.expect
const config = require('config')
const mongoose = require('mongoose')
const httpMocks = require('node-mocks-http')
const sinon = require('sinon')
const debug = require('debug')('jb-weather:utils:api-rate-limiter:test')

const { HTTP_HEADER_RATE_LIMIT_LIMIT, HTTP_HEADER_RATE_LIMIT_REMAINING, HTTP_HEADER_RATE_LIMIT_RESET } = require('../constants')
const apiKeys = require('../api-keys')
const apiKeyRateLimiter = require('../api-rate-limiter')

const VALID_API_KEY = apiKeys[0]
const INVALID_API_KEY = 'invalid'

// Please refer How API Rate Limiter Works section in README.md file

describe('api-rate-limiter tests', () => {
  before(async () => {
    // Connect to mongodb server
    await mongoose.connect(config.apiKeyRateLimiter.mongoUri, { useNewUrlParser: true })
  })

  describe('api-rate-limiter middleware tests', () => {
    const requestWithValidApiKey = httpMocks.createRequest({
      method: 'GET',
      url: `/weather/uk/london`
    })
    requestWithValidApiKey.username = VALID_API_KEY
    const responseForRequestWithValidApiKey = httpMocks.createResponse()

    const requestWithInvalidApiKey = httpMocks.createRequest({
      method: 'GET',
      url: `/weather/uk/london`
    })
    requestWithInvalidApiKey.username = INVALID_API_KEY
    const responseForRequestWithInvalidApiKey = httpMocks.createResponse()

    it('should reject invalid API key', async () => {
      const spiedNext = sinon.spy()
      await apiKeyRateLimiter(requestWithInvalidApiKey, responseForRequestWithInvalidApiKey, spiedNext)
      const nextCalledWith = spiedNext.args[0][0]
      debug('nextCalledWith', nextCalledWith)

      expect(spiedNext.called, 'next should be called').to.be.true
      expect(nextCalledWith.name === 'UnauthorizedError', 'should call next with UnauthorizedError error').to.be.true
    })
    it('should allow 1st API call with valid API key', async () => {
      const spiedNext = sinon.spy()
      const nowInUtcSeconds = Math.floor(Date.now() / 1000)
      await apiKeyRateLimiter(requestWithValidApiKey, responseForRequestWithValidApiKey, spiedNext)
      const rateLimitLimit = responseForRequestWithValidApiKey.getHeader(HTTP_HEADER_RATE_LIMIT_LIMIT)
      const rateLimitRemaining = responseForRequestWithValidApiKey.getHeader(HTTP_HEADER_RATE_LIMIT_REMAINING)
      const rateLimitReset = responseForRequestWithValidApiKey.getHeader(HTTP_HEADER_RATE_LIMIT_RESET)
      debug('rateLimitLimit', rateLimitLimit)
      debug('rateLimitRemaining', rateLimitRemaining)
      debug('rateLimitReset', rateLimitReset)

      expect(spiedNext.called, 'next should be called').to.be.true
      expect(spiedNext.calledWithExactly(), 'next shoud be called with no arguments').to.be.true
      expect(parseInt(rateLimitLimit, 10), 'limit should be 1').to.equal(1)
      expect(parseInt(rateLimitRemaining, 10), 'remaining should be 0').to.equal(0)
      expect(parseInt(rateLimitReset, 10), 'reset should be in the future').to.be.above(nowInUtcSeconds)
    })
    it('should reject 2nd API call with valid API key, because the limit for test is set to 1 per 60 seconds', async () => {
      const spiedNext = sinon.spy()
      const nowInUtcSeconds = Math.floor(Date.now() / 1000)
      await apiKeyRateLimiter(requestWithValidApiKey, responseForRequestWithValidApiKey, spiedNext)
      const rateLimitLimit = responseForRequestWithValidApiKey.getHeader(HTTP_HEADER_RATE_LIMIT_LIMIT)
      const rateLimitRemaining = responseForRequestWithValidApiKey.getHeader(HTTP_HEADER_RATE_LIMIT_REMAINING)
      const rateLimitReset = responseForRequestWithValidApiKey.getHeader(HTTP_HEADER_RATE_LIMIT_RESET)
      const nextCalledWith = spiedNext.args[0][0]
      debug('rateLimitLimit', rateLimitLimit)
      debug('rateLimitRemaining', rateLimitRemaining)
      debug('rateLimitReset', rateLimitReset)
      debug('nextCalledWith', nextCalledWith)

      expect(spiedNext.called, 'next should be called').to.be.true
      expect(nextCalledWith.name === 'TooManyRequestsError', 'should call next with TooManyRequestsError error').to.be.true
      expect(parseInt(rateLimitLimit, 10), 'limit should be 1').to.equal(1)
      expect(parseInt(rateLimitRemaining, 10), 'remaining should be 0').to.equal(0)
      expect(parseInt(rateLimitReset, 10), 'reset should be in the future').to.be.above(nowInUtcSeconds)
    })
  })

  after(async () => {
    // Drop database after test
    /* istanbul ignore else */
    if (mongoose.connection.readyState) {
      await mongoose.connection.db.dropDatabase()
      await mongoose.disconnect()
    }
  })
})
