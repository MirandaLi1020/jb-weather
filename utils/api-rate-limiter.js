
const { logger } = require('./logger')
const mongoose = require('mongoose')
const config = require('config')
const { UnauthorizedError, TooManyRequestsError, InternalServerError } = require('restify-errors')
const debug = require('debug')('jb-weather:utils:api-rate-limiter')

const apiKeys = require('./api-keys')
const ApiKeyUsageModel = require('./api-key-usage-model')
const { HTTP_HEADER_RATE_LIMIT_LIMIT, HTTP_HEADER_RATE_LIMIT_REMAINING, HTTP_HEADER_RATE_LIMIT_RESET } = require('./constants')

const apiKeyRateLimiterLimit = config.apiKeyRateLimiter.limit
const apiKeyRateLimiterUnitInSecond = config.apiKeyRateLimiter.unitInSecond

const createApiRateLimiter = async (req, res, next) => {
  /* istanbul ignore else */
  if (mongoose.connection.readyState) {
    // Check is API key provided
    const apiKey = req.username && req.username.toLowerCase()
    debug('apiKey', apiKey)

    if (apiKey && apiKeys.indexOf(apiKey) >= 0) {
      // Valid API key, get usage
      try {
        const usageDoc = await ApiKeyUsageModel.findOneAndUpdate({
          key: apiKey
        }, {
          $inc: {
            usage: 1
          }
        }, {
          new: true, // Return modified version instead of previous one
          upsert: true, // Create if not exist
          setDefaultsOnInsert: true // Set default value on creation
        }).exec()
        /* istanbul ignore else */
        if (usageDoc) {
          // Check usage
          const isOverLimit = (usageDoc.usage > apiKeyRateLimiterLimit)
          const remainingUsage = (usageDoc.usage >= apiKeyRateLimiterLimit) ? 0 : /* istanbul ignore next */ (apiKeyRateLimiterLimit - usageDoc.usage)
          const reset = Math.floor(usageDoc.usedAt.getTime() / 1000) + apiKeyRateLimiterUnitInSecond // Reset is in UTC second
          debug('isOverLimit', isOverLimit)
          debug('remainingUsage', remainingUsage)
          debug('reset', reset)
          // Set rate limit headers
          res.header(HTTP_HEADER_RATE_LIMIT_LIMIT, apiKeyRateLimiterLimit)
          res.header(HTTP_HEADER_RATE_LIMIT_REMAINING, remainingUsage)
          res.header(HTTP_HEADER_RATE_LIMIT_RESET, reset)
          if (isOverLimit) {
            // Red light
            return next(new TooManyRequestsError())
          } else {
            // Green light
            return next()
          }
        } else {
          // Could not create usage due to unknown database error, log and return InternalServerError
          logger.error(`api-rate-limiter: could not save usage`)
          return next(new InternalServerError())
        }
      } catch (error) {
        // Database error, log and return InternalServerError
        /* istanbul ignore next */
        logger.error(`api-rate-limiter: database error: ${error}`)
        /* istanbul ignore next */
        return next(new InternalServerError())
      }
    } else {
      return next(new UnauthorizedError('API Key required'))
    }
  } else {
    // Database is not ready, Abort!
    return next(new InternalServerError())
  }
}

module.exports = createApiRateLimiter
