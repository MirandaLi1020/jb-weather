const config = require('config')
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ApiKeyUsage = new Schema({
  key: {
    type: String,
    required: true,
    trim: true
  },
  usedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  usage: {
    type: Number,
    required: true,
    default: 1
  }
}, {
  autoIndex: true
})

ApiKeyUsage.index({
  key: 1
}, {
  unique: true
})

ApiKeyUsage.index({
  usedAt: 1
}, {
  expireAfterSeconds: config.apiKeyRateLimiter.unitInSecond
})

module.exports = mongoose.model('ApiKeyUsage', ApiKeyUsage)
