const winston = require('winston')
const config = require('config')

const logger = winston.createLogger({
  level: config.logger.level,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console() // In this project, we will just send logs to console, BTW if we deploy this app to AWS ECS or Lambda, console log could be sent to CloudWatch
  ]
})

module.exports = logger
