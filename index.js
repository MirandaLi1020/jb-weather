const mongoose = require('mongoose')
const config = require('config')

const logger = require('./utils/logger')
const server = require('./server')

server.listen(config.server.port, () => {
  logger.info(`server listening at ${server.url}`)
})

const db = mongoose.connection

db.once('error', error => {
  // Could not connect at startup, is mongodb server running??
  logger.error(`Could not connect to mongodb at startup, is mongodb server running? mongodb error: ${error}`)
  process.exit()
})

db.once('open', () => {
  logger.info('mongodb connection opened')
})

db.on('close', () => {
  logger.info('mongodb connection closed')
  process.exit()
})

db.on('reconnected', () => {
  logger.warn('mongodb reconnected')
})

db.on('reconnectFailed', () => {
  logger.error('mongodb reconnect failed')
  process.exit()
})

const handleExiting = () => {
  if (mongoose.connection.readyState) {
    logger.info('disconnecting mongodb')
    mongoose.disconnect()
  } else {
    process.exit()
  }
}

const signalsToHandle = [
  'exit', // Normal exit
  'SIGINT', // Ctrl + c
  'SIGTERM', // docker stop
  'SIGUSR1', // Kill pid
  'SIGUSR2' // Kill pid
]

signalsToHandle.forEach(signal => {
  process.on(signal, handleExiting)
})
