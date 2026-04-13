'use strict';

const request = require('supertest');
const app = require('../src/server');
const { seedPromise } = require('../src/services/authService');

describe('Auth API', () => {
  beforeAll(async () => {
    // Wait for the asynchronous seeding in authService to complete
    await seedPromise;
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid admin credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@ehr.local',
          password: 'Admin@123'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toEqual('admin');
    });

    it('should fail to login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@ehr.local',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });
  });

  describe('Role Protection', () => {
    it('should deny a patient access to admin routes', async () => {
      // 1. Login as patient
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'patient@ehr.local',
          password: 'Patient@123'
        });
      
      const token = loginRes.body.token;

      // 2. Try to access admin stats
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('error', 'Insufficient permissions');
    });
  });
});
