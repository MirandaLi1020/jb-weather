/* globals describe, it, after */

const request = require('supertest')
const mongoose = require('mongoose')

const server = require('../server')

describe('server.js tests', () => {
  // Just a simple integration test for testing in development environment
  it('should response 200 for GET /weather/australia/melbourne with valid API key', () => {
    return request(server)
      .get('/weather/australia/melbourne')
      .set('Accept', 'application/json')
      .auth('27f01d68e204427fbeb7c0dff06c7e94', 'x')
      .expect(200)
  })
  it('should response 401 for GET /weather/australia/melbourne with invalid API key', () => {
    return request(server)
      .get('/weather/australia/melbourne')
      .set('Accept', 'application/json')
      .auth('INVALID_API_KEY', 'x')
      .expect(401)
  })

  after(async () => {
    if (mongoose.connection.readyState) {
      await mongoose.disconnect()
    }
  })
})
