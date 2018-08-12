module.exports = {
  openWeatherMapApi: {
    apiHost: 'https://mockup-api.openweathermap.org',
    apiKey: 'A_VALID_API_KEY'
  },
  logger: {
    level: 'debug'
  },
  apiKeyRateLimiter: {
    limit: 1,
    unitInSecond: 60,
    mongoUri: 'mongodb://localhost:27017/jb_weather_test'
  }
}
