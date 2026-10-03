const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Core API Endpoint Tests', () => {
  // Ensure mongoose connection is closed after all tests
  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('GET /', () => {
    it('should return API is running message', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toEqual(200);
      expect(res.text).toContain('API is running...');
    });
  });

  describe('GET /api/non-existent-route', () => {
    it('should return a 404 response', async () => {
      const res = await request(app).get('/api/non-existent-route');
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'Resource not found');
    });
  });
});
