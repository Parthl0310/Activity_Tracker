import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { afterAll, beforeAll } from 'vitest';
import IORedis from 'ioredis';
import { Queue } from 'bullmq';

// Create redis instances that we can close after tests so they don't hang
export let redisClient: IORedis;

beforeAll(async () => {
  // Connect to DB
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB for testing');
  } catch (err) {
    console.error('Failed to connect to MongoDB during test setup', err);
  }

  // Connect to Redis
  try {
    redisClient = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
  } catch (err) {
    console.error('Failed to connect to Redis during test setup', err);
  }
});

afterAll(async () => {
  await mongoose.connection.close();
  if (redisClient) {
    redisClient.quit();
  }
});
