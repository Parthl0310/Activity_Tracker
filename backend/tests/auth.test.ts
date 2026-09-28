import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Application } from 'express';

describe('Auth Endpoints (Phase 3)', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  it('POST /auth/register should create a user', async () => {
    const email = `auth-test-${Date.now()}@test.com`;
    const res = await request(app)
      .post('/auth/signup')
      .send({ name: 'Test User', email, password: 'password123' });
    
    expect(res.status).toBe(201);
    expect(res.body.data.tokens).toHaveProperty('accessToken');
  });

  it('POST /auth/login should authenticate the user', async () => {
    const email = `login-test-${Date.now()}@test.com`;
    // Register first
    await request(app).post('/auth/signup').send({ name: 'Test User', email, password: 'password123' });
    
    // Then login
    const res = await request(app)
      .post('/auth/login')
      .send({ email, password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.tokens).toHaveProperty('accessToken');
  });
});
