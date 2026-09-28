import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import IORedis from 'ioredis';
import { embedText, getPineconeIndex } from '../../ai-model/src/index.js';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

async function runPhase0() {
  console.log('=== PHASE 0: PRE-FLIGHT CHECKS ===\n');

  // P0-01: Env check
  const requiredEnv = [
    'PORT', 'NODE_ENV', 'MONGODB_URI', 'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET', 'JWT_ACCESS_EXPIRY', 'JWT_REFRESH_EXPIRY',
    'FRONTEND_URL', 'REDIS_URL', 'GEMINI_API_KEY', 'GEMINI_MODEL',
    'EMBEDDING_MODEL', 'EMBEDDING_DIM', 'PINECONE_API_KEY', 'PINECONE_INDEX'
  ];
  const missing = requiredEnv.filter(k => !process.env[k]);
  console.log('P0-01 (Env Check):', missing.length === 0 ? 'PASS (All 15 env vars present)' : `FAIL (Missing: ${missing.join(', ')})`);

  // P0-02: MongoDB
  let mongoStatus = 'FAIL';
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI!);
    const admin = conn.connection.db!.admin();
    const serverStatus = await admin.serverStatus();
    mongoStatus = `PASS (Connected, version: ${serverStatus.version})`;
    await mongoose.disconnect();
  } catch (err: any) {
    mongoStatus = `FAIL (${err.message})`;
  }
  console.log('P0-02 (MongoDB Check):', mongoStatus);

  // P0-03: Redis
  let redisStatus = 'FAIL';
  try {
    const redis = new IORedis(process.env.REDIS_URL!, {
      tls: process.env.REDIS_URL?.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
      connectTimeout: 5000,
      lazyConnect: true,
      maxRetriesPerRequest: null,
    });
    await redis.connect();
    const pong = await redis.ping();
    redisStatus = `PASS (Ping response: ${pong})`;
    await redis.quit();
  } catch (err: any) {
    redisStatus = `FAIL (${err.message})`;
  }
  console.log('P0-03 (Redis Check):', redisStatus);

  // P0-04: Pinecone
  let pineconeStatus = 'FAIL';
  try {
    const idx = getPineconeIndex();
    const stats = await idx.describeIndexStats();
    pineconeStatus = `PASS (Index accessible, totalRecordCount: ${stats.totalRecordCount}, namespaces: ${Object.keys(stats.namespaces || {}).join(', ') || 'none'})`;
  } catch (err: any) {
    pineconeStatus = `FAIL (${err.message})`;
  }
  console.log('P0-04 (Pinecone Check):', pineconeStatus);

  // P0-05: Gemini Key & Model
  let geminiStatus = 'FAIL';
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data: any = await res.json();
    if (data.models && data.models.length > 0) {
      geminiStatus = `PASS (Key valid, ${data.models.length} models accessible)`;
    } else {
      geminiStatus = `FAIL (${JSON.stringify(data)})`;
    }
  } catch (err: any) {
    geminiStatus = `FAIL (${err.message})`;
  }
  console.log('P0-05 (Gemini API Check):', geminiStatus);

  // P0-06: Local Embedding MiniLM
  let embedStatus = 'FAIL';
  try {
    const vec = await embedText('Continuous activity tracking system check');
    if (vec && vec.length === 384) {
      embedStatus = `PASS (Vector generated with dimension 384)`;
    } else {
      embedStatus = `FAIL (Dimension: ${vec?.length})`;
    }
  } catch (err: any) {
    embedStatus = `FAIL (${err.message})`;
  }
  console.log('P0-06 (Embedding Check):', embedStatus);

  // P0-07: API Server
  let apiStatus = 'FAIL';
  try {
    const res = await fetch(`http://localhost:${process.env.PORT || 4000}/health`);
    const json: any = await res.json();
    if (json.status === 'ok') {
      apiStatus = `PASS (Service: ${json.service}, status: 200 OK)`;
    } else {
      apiStatus = `FAIL (${JSON.stringify(json)})`;
    }
  } catch (err: any) {
    apiStatus = `FAIL (${err.message})`;
  }
  console.log('P0-07 (API Server Health):', apiStatus);

  // P0-09: Frontend
  let webStatus = 'FAIL';
  try {
    const res = await fetch('http://localhost:5173/login');
    if (res.status === 200) {
      webStatus = 'PASS (HTTP 200 OK, Vite server active)';
    } else {
      webStatus = `FAIL (HTTP ${res.status})`;
    }
  } catch (err: any) {
    webStatus = `FAIL (${err.message})`;
  }
  console.log('P0-09 (Frontend Web Check):', webStatus);
}

runPhase0().catch(console.error);
