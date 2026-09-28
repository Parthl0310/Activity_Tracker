import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Application } from 'express';

describe('End-to-End Workflow (Phase 10)', () => {
  let app: Application;
  let token = '';

  beforeAll(() => {
    app = createApp();
  });

  it('1. Create user and login', async () => {
    const email = `e2e-test-${Date.now()}@test.com`;
    const signupRes = await request(app)
      .post('/auth/signup')
      .send({ name: 'Test User', email, password: 'password123' });
    
    expect(signupRes.status).toBe(201);
    token = signupRes.body.data.tokens.accessToken;
  });

  it('2. Add an activity (AI enrichment queue)', async () => {
    const res = await request(app)
      .post('/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Refactored backend checkout module to use Zod', workDate: new Date().toISOString() });
    
    expect(res.status).toBe(201);
  });

  it('3. Search Activity (RAG Vector retrieval)', async () => {
    // Note: The vector search might return empty if Pinecone index is slow to update, 
    // but the endpoint itself should return 200.
    const res = await request(app)
      .post('/search/ask')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'What did I refactor recently?' });
      
    expect(res.status).toBe(200);
  });
});
