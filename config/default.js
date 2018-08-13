module.exports = {
  openWeatherMapApi: {
    apiHost: process.env.OPEN_WEATHER_API_HOST || 'https://api.openweathermap.org/',
    apiKey: process.env.OPEN_WEATHER_API_KEY || 'b7b3881ebdfeb1b7738c7ba85260fb3f' // NEVER PUT API KEY IN SOURCE CODE, this is just for reviewer's convenience, so they do not need to sign up Open Weather Map accounts
  },
  logger: {
    level: 'info'
  },
  apiKeyRateLimiter: {
    limit: parseInt(process.env.API_KEY_LIMITER_LIMIT, 10) || 5,
    unitInSecond: parseInt(process.env.API_KEY_LIMITER_UNIT_SECOND, 10) || 3600,
    mongoUri: process.env.API_KEY_LIMITER_MONGO_URI || 'mongodb://localhost:27017/jb_weather',
    mongoReconnectTries: 30,
    mongoReconnectInterval: 1000 // Retry 30 times every 1 second
  }
}
