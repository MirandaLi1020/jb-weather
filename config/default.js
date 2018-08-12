module.exports = {
  openWeatherMapApi: {
    apiHost: process.env.OPEN_WEATHER_API_HOST || 'https://api.openweathermap.org/',
    apiKey: process.env.OPEN_WEATHER_API_KEY || 'b7b3881ebdfeb1b7738c7ba85260fb3f' // NEVER PUT API KEY IN SOURCE CODE, this is just for reviewer's convenience, so they do not need to sign up Open Weather Map accounts
  },
  logger: {
    level: 'info'
  }
}
