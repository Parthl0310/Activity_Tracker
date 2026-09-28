import { MongoClient } from 'mongodb';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

async function testConnections() {
  console.log('Testing MongoDB connection...');
  const mongoClient = new MongoClient(process.env.MONGODB_URI);
  try {
    await mongoClient.connect();
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
  } finally {
    await mongoClient.close();
  }

  console.log('\nTesting Redis connection...');
  const redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
    process.exit(0);
  });

  redis.on('error', (err) => {
    console.error('❌ Redis connection failed:', err.message);
    process.exit(1);
  });
}

testConnections();
